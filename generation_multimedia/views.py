import io
import os
import time
from pathlib import Path
import subprocess

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from typing import Optional


class TextToImageView(APIView):
    # Fully public: bypass auth entirely to avoid 401s from stale/invalid tokens
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """
        Generate an image from a text prompt using Hugging Face Inference API.
        Request JSON:
          - prompt: str (required)
          - model: str (optional) e.g. "black-forest-labs/FLUX.1-schnell" or "stabilityai/stable-diffusion-2-1"
        Response JSON:
          { "image_url": "/media/generated/....png" }
        """
        data = request.data or {}
        prompt = data.get('prompt')
        # Use a permissive default model known to work on HF Inference API
        requested_model = data.get('model')
        endpoint_url = data.get('endpoint_url')  # Optional: direct Inference Endpoint or Space URL
        default_models = [
            'runwayml/stable-diffusion-v1-5',
        ]
        model_candidates = [requested_model] if requested_model else []
        model_candidates += [m for m in default_models if m not in model_candidates]

        if not prompt:
            return JsonResponse({"detail": "'prompt' is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the Hugging Face API key from env or header; fallback to provided key if missing (server-side only)
        api_key = (
            os.getenv('HUGGINGFACE_API_KEY')
            or request.headers.get('X-HF-Key')
            or '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'
        )
        # Note: Hardcoding API keys is not recommended. This fallback is at user's request and remains server-side.

        def try_generate(model_name: str):
            url = endpoint_url or f"https://api-inference.huggingface.co/models/{model_name}"
            headers = {
                "Authorization": f"Bearer {api_key}",
                # Accept any image back (PNG/JPEG/WEBP)
                "Accept": "*/*",
                "Content-Type": "application/json",
            }
            # Allow clients to pass model-specific parameters (e.g., width/height/steps/seed)
            params = data.get('parameters') or {}
            payload = {
                "inputs": prompt,
                "options": {"wait_for_model": True},
            }
            if params:
                payload["parameters"] = params
            resp = requests.post(url, headers=headers, json=payload, timeout=120)
            return resp

        last_error = None
        for model in model_candidates if not endpoint_url else [requested_model or 'custom-endpoint']:
            try:
                resp = try_generate(model)
            except requests.RequestException as e:
                last_error = {"error": str(e)}
                continue

            if resp.status_code == 200:
                content_type = resp.headers.get('Content-Type', '')
                if content_type.startswith('image/'):
                    # pick extension
                    ext = 'png'
                    if 'jpeg' in content_type or 'jpg' in content_type:
                        ext = 'jpg'
                    elif 'webp' in content_type:
                        ext = 'webp'

                    img_bytes = resp.content
                    generated_dir = Path(settings.MEDIA_ROOT) / 'generated'
                    generated_dir.mkdir(parents=True, exist_ok=True)
                    filename = f"gen_{int(time.time()*1000)}.{ext}"
                    file_path = generated_dir / filename
                    with open(file_path, 'wb') as f:
                        f.write(img_bytes)

                    image_url = f"{settings.MEDIA_URL}generated/{filename}"
                    return JsonResponse({"image_url": image_url, "model_used": model})
                else:
                    # Not image; try to parse JSON error/info
                    try:
                        last_error = resp.json()
                    except Exception:
                        last_error = {"status": resp.status_code, "body": resp.text[:500]}
            else:
                # Non-200; collect details
                try:
                    last_error = resp.json()
                except Exception:
                    last_error = {"status": resp.status_code, "body": resp.text[:500]}

        return JsonResponse({
            "detail": "Hugging Face error",
            "tried_models": model_candidates if not endpoint_url else [endpoint_url],
            "upstream": last_error,
        }, status=status.HTTP_502_BAD_GATEWAY)


class RecentImagesView(APIView):
    # Fully public: bypass auth entirely to avoid 401s from stale/invalid tokens
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        """
        List recently generated images from media/generated (sorted by modified time desc).
        Query params:
          - limit: int (default 12)
        Response: { items: [ { filename, image_url, created_at, size } ] }
        """
        try:
            limit = int(request.GET.get('limit', '12'))
        except ValueError:
            limit = 12

        gen_dir = Path(settings.MEDIA_ROOT) / 'generated'
        items = []
        if gen_dir.exists():
            for p in gen_dir.iterdir():
                if not p.is_file():
                    continue
                # Only include typical image extensions
                if p.suffix.lower() not in {'.png', '.jpg', '.jpeg', '.webp'}:
                    continue
                try:
                    stat = p.stat()
                except OSError:
                    continue
                items.append({
                    'filename': p.name,
                    'image_url': f"{settings.MEDIA_URL}generated/{p.name}",
                    'created_at': int(stat.st_mtime),  # epoch seconds for easy sorting in client if needed
                    'size': stat.st_size,
                })

        # Sort by modified time desc
        items.sort(key=lambda x: x['created_at'], reverse=True)
        items = items[:limit]
        return JsonResponse({ 'items': items })


class DeleteImageView(APIView):
    # Fully public for now; consider restricting in production
    permission_classes = [AllowAny]
    authentication_classes = []

    def delete(self, request, filename: str):
        """
        Delete a single generated image by filename.
        Path traversal is prevented and only files under media/generated with image extensions are allowed.
        """
        # Allow only simple filenames (no path separators)
        if '/' in filename or '\\' in filename:
            return JsonResponse({"detail": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)

        allowed_ext = {'.png', '.jpg', '.jpeg', '.webp'}
        ext = Path(filename).suffix.lower()
        if ext not in allowed_ext:
            return JsonResponse({"detail": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)

        gen_dir = Path(settings.MEDIA_ROOT) / 'generated'
        target_path = (gen_dir / filename).resolve()
        # Ensure the resolved path is still under gen_dir
        try:
            gen_dir_resolved = gen_dir.resolve()
        except FileNotFoundError:
            gen_dir.mkdir(parents=True, exist_ok=True)
            gen_dir_resolved = gen_dir.resolve()

        if not str(target_path).startswith(str(gen_dir_resolved)):
            return JsonResponse({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)

        if not target_path.exists() or not target_path.is_file():
            return JsonResponse({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_path.unlink()
        except OSError as e:
            return JsonResponse({"detail": f"Delete failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponse({"detail": "Deleted", "filename": filename})


class TextToVideoView(APIView):
    # Public endpoint now using Pexels Videos API instead of model-based generation
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        """
        Fetch a stock video matching the prompt using Pexels and save it locally.
        Request JSON:
          - prompt: str (required)
          - per_page: int (optional, default 10)
        Response JSON: { "video_url": "/media/generated/videos/....mp4", "model_used": "pexels", "pexels": {...} }
        """
        data = request.data or {}
        prompt = (data.get('prompt') or '').strip()
        try:
            per_page = int(data.get('per_page', 10))
        except Exception:
            per_page = 10

        if not prompt:
            return JsonResponse({"detail": "'prompt' is required"}, status=status.HTTP_400_BAD_REQUEST)

        pexels_key = os.getenv('PEXELS_API_KEY') or 'sMYqSfbyNDNdXt6XjAixGUVdUCCro5RsvEYA92HxJmlJMw59j7swAdJP'
        headers = {"Authorization": pexels_key}
        params = {
            "query": prompt,
            "per_page": per_page,
        }

        try:
            search_resp = requests.get("https://api.pexels.com/videos/search", headers=headers, params=params, timeout=30)
        except requests.RequestException as e:
            return JsonResponse({"detail": "Pexels search error", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        if search_resp.status_code != 200:
            try:
                err = search_resp.json()
            except Exception:
                err = {"status": search_resp.status_code, "body": search_resp.text[:500]}
            return JsonResponse({"detail": "Pexels search failed", "upstream": err}, status=status.HTTP_502_BAD_GATEWAY)

        js = search_resp.json() or {}
        videos = js.get('videos') or []
        if not videos:
            return JsonResponse({"detail": "Aucune vidéo trouvée pour cette requête."}, status=status.HTTP_404_NOT_FOUND)

        # Pick the first suitable mp4, prefer sd/hd quality
        chosen_video = None
        chosen_file = None
        for v in videos:
            files = v.get('video_files') or []
            # sort by quality preference: sd, hd, tiny, others
            def q_rank(f):
                q = (f.get('quality') or '').lower()
                rank = {"sd": 0, "hd": 1, "tiny": 2}
                return rank.get(q, 3)
            files_sorted = sorted([f for f in files if (f.get('file_type') or '').lower() == 'video/mp4'], key=q_rank)
            if files_sorted:
                chosen_video = v
                chosen_file = files_sorted[0]
                break

        if not chosen_video or not chosen_file:
            return JsonResponse({"detail": "Aucun fichier MP4 adéquat trouvé dans les résultats."}, status=status.HTTP_404_NOT_FOUND)

        file_link = chosen_file.get('link')
        if not file_link:
            return JsonResponse({"detail": "Lien du fichier vidéo introuvable."}, status=status.HTTP_502_BAD_GATEWAY)

        # Download the video bytes
        try:
            file_resp = requests.get(file_link, timeout=120)
        except requests.RequestException as e:
            return JsonResponse({"detail": "Téléchargement de la vidéo Pexels échoué", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        if file_resp.status_code != 200:
            return JsonResponse({"detail": "Téléchargement de la vidéo Pexels échoué", "status": file_resp.status_code}, status=status.HTTP_502_BAD_GATEWAY)

        # Save to media/generated/videos
        clips_dir = Path(settings.MEDIA_ROOT) / 'generated' / 'videos'
        clips_dir.mkdir(parents=True, exist_ok=True)
        vid_id = chosen_video.get('id') or int(time.time()*1000)
        filename = f"clip_pexels_{vid_id}_{int(time.time()*1000)}.mp4"
        with open(clips_dir / filename, 'wb') as f:
            f.write(file_resp.content)

        video_url = f"{settings.MEDIA_URL}generated/videos/{filename}"
        pinfo = {
            "id": chosen_video.get('id'),
            "url": chosen_video.get('url'),
            "width": chosen_video.get('width'),
            "height": chosen_video.get('height'),
            "duration": chosen_video.get('duration'),
            "photographer": chosen_video.get('user', {}).get('name'),
            "file_quality": chosen_file.get('quality'),
        }

        return JsonResponse({
            "video_url": video_url,
            "model_used": "pexels",
            "pexels": pinfo,
        })


class RecentClipsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            limit = int(request.GET.get('limit', '12'))
        except ValueError:
            limit = 12

        clips_dir = Path(settings.MEDIA_ROOT) / 'generated' / 'videos'
        items = []
        if clips_dir.exists():
            for p in clips_dir.iterdir():
                if not p.is_file():
                    continue
                if p.suffix.lower() not in {'.mp4', '.webm', '.gif'}:
                    continue
                try:
                    stat = p.stat()
                except OSError:
                    continue
                # Detect adjacent subtitles
                subs = {}
                vtt = p.with_suffix('.vtt')
                srt = p.with_suffix('.srt')
                if vtt.exists():
                    subs['vtt'] = f"{settings.MEDIA_URL}generated/videos/{vtt.name}"
                if srt.exists():
                    subs['srt'] = f"{settings.MEDIA_URL}generated/videos/{srt.name}"
                items.append({
                    'filename': p.name,
                    'video_url': f"{settings.MEDIA_URL}generated/videos/{p.name}",
                    'created_at': int(stat.st_mtime),
                    'size': stat.st_size,
                    'location': 'generated',
                    'subtitles': subs,
                })

        items.sort(key=lambda x: x['created_at'], reverse=True)
        return JsonResponse({'items': items[:limit]})


class RecentUploadedClipsView(APIView):
    """List recent uploaded clips from media/uploads."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            limit = int(request.GET.get('limit', '12'))
        except ValueError:
            limit = 12

        uploads_dir = Path(settings.MEDIA_ROOT) / 'uploads'
        items = []
        if uploads_dir.exists():
            for p in uploads_dir.iterdir():
                if not p.is_file():
                    continue
                if p.suffix.lower() not in {'.mp4', '.webm', '.gif', '.mkv', '.mov', '.avi'}:
                    continue
                try:
                    stat = p.stat()
                except OSError:
                    continue
                subs = {}
                vtt = p.with_suffix('.vtt')
                srt = p.with_suffix('.srt')
                if vtt.exists():
                    subs['vtt'] = f"{settings.MEDIA_URL}uploads/{vtt.name}"
                if srt.exists():
                    subs['srt'] = f"{settings.MEDIA_URL}uploads/{srt.name}"
                items.append({
                    'filename': p.name,
                    'video_url': f"{settings.MEDIA_URL}uploads/{p.name}",
                    'created_at': int(stat.st_mtime),
                    'size': stat.st_size,
                    'location': 'uploads',
                    'subtitles': subs,
                })

        items.sort(key=lambda x: x['created_at'], reverse=True)
        return JsonResponse({'items': items[:limit]})


class DeleteClipView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def delete(self, request, filename: str):
        if '/' in filename or '\\' in filename:
            return JsonResponse({"detail": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)

        allowed_ext = {'.mp4', '.webm', '.gif'}
        ext = Path(filename).suffix.lower()
        if ext not in allowed_ext:
            return JsonResponse({"detail": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)

        clips_dir = Path(settings.MEDIA_ROOT) / 'generated' / 'videos'
        target_path = (clips_dir / filename).resolve()
        try:
            clips_dir_resolved = clips_dir.resolve()
        except FileNotFoundError:
            clips_dir.mkdir(parents=True, exist_ok=True)
            clips_dir_resolved = clips_dir.resolve()

        if not str(target_path).startswith(str(clips_dir_resolved)):
            return JsonResponse({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)

        if not target_path.exists() or not target_path.is_file():
            return JsonResponse({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_path.unlink()
        except OSError as e:
            return JsonResponse({"detail": f"Delete failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponse({"detail": "Deleted", "filename": filename})


class DeleteUploadedClipView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def delete(self, request, filename: str):
        if '/' in filename or '\\' in filename:
            return JsonResponse({"detail": "Invalid filename"}, status=status.HTTP_400_BAD_REQUEST)

        allowed_ext = {'.mp4', '.webm', '.gif', '.mkv', '.mov', '.avi'}
        ext = Path(filename).suffix.lower()
        if ext not in allowed_ext:
            return JsonResponse({"detail": "Unsupported file type"}, status=status.HTTP_400_BAD_REQUEST)

        uploads_dir = Path(settings.MEDIA_ROOT) / 'uploads'
        target_path = (uploads_dir / filename).resolve()
        try:
            uploads_resolved = uploads_dir.resolve()
        except FileNotFoundError:
            uploads_dir.mkdir(parents=True, exist_ok=True)
            uploads_resolved = uploads_dir.resolve()

        if not str(target_path).startswith(str(uploads_resolved)):
            return JsonResponse({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)

        if not target_path.exists() or not target_path.is_file():
            return JsonResponse({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            target_path.unlink()
            # Also try to remove adjacent subtitle files if present
            for ext2 in ('.srt', '.vtt'):
                sub_path = target_path.with_suffix(ext2)
                try:
                    if sub_path.exists():
                        sub_path.unlink()
                except OSError:
                    pass
        except OSError as e:
            return JsonResponse({"detail": f"Delete failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponse({"detail": "Deleted", "filename": filename})


## Removed ImageToVideoView and img2vid fallback as per request


class GenerateSubtitlesView(APIView):
    """Create subtitles (SRT/VTT) for a local video using AssemblyAI."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data or {}
        filename = data.get('filename')  # expected simple filename
        location = (data.get('location') or '').lower()  # optional: 'generated' | 'uploads'
        out_format = (data.get('format') or 'srt').lower()
        if out_format not in {'srt', 'vtt'}:
            out_format = 'srt'

        if not filename or '/' in filename or '\\' in filename:
            return JsonResponse({"detail": "'filename' is required and must be a simple filename"}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve base directory based on location (or autodetect)
        gen_dir = Path(settings.MEDIA_ROOT) / 'generated' / 'videos'
        up_dir = Path(settings.MEDIA_ROOT) / 'uploads'

        base_dir: Optional[Path] = None
        if location == 'generated':
            base_dir = gen_dir
        elif location == 'uploads':
            base_dir = up_dir
        else:
            # autodetect: prefer generated/videos, else uploads
            if (gen_dir / filename).exists():
                base_dir = gen_dir
                location = 'generated'
            elif (up_dir / filename).exists():
                base_dir = up_dir
                location = 'uploads'

        if base_dir is None:
            base_dir = gen_dir
            location = 'generated'

        video_path = (base_dir / filename).resolve()
        try:
            base_dir_resolved = base_dir.resolve()
        except FileNotFoundError:
            base_dir.mkdir(parents=True, exist_ok=True)
            base_dir_resolved = base_dir.resolve()

        if not str(video_path).startswith(str(base_dir_resolved)):
            return JsonResponse({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)
        if not video_path.exists() or not video_path.is_file():
            return JsonResponse({"detail": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        # AssemblyAI API key
        aai_key = os.getenv('ASSEMBLYAI_API_KEY') or '80d6d2a337ef45c8b049473a0d615c1c'

        # 1) Upload the video file to AssemblyAI
        upload_url = 'https://api.assemblyai.com/v2/upload'
        headers_upload = {"authorization": aai_key}

        def read_chunks(fp, chunk_size=5 * 1024 * 1024):
            while True:
                data = fp.read(chunk_size)
                if not data:
                    break
                yield data

        try:
            with open(video_path, 'rb') as f:
                up_resp = requests.post(upload_url, headers=headers_upload, data=read_chunks(f), timeout=600)
        except requests.RequestException as e:
            return JsonResponse({"detail": "Upload error", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        if up_resp.status_code != 200:
            try:
                up_err = up_resp.json()
            except Exception:
                up_err = {"status": up_resp.status_code, "body": up_resp.text[:500]}
            return JsonResponse({"detail": "Upload failed", "upstream": up_err}, status=status.HTTP_502_BAD_GATEWAY)

        up_json = up_resp.json()
        audio_url = up_json.get('upload_url')
        if not audio_url:
            return JsonResponse({"detail": "Upload URL missing from response"}, status=status.HTTP_502_BAD_GATEWAY)

        # 2) Create transcript (AssemblyAI uses singular 'transcript')
        create_url = 'https://api.assemblyai.com/v2/transcript'
        headers_json = {
            "authorization": aai_key,
            "content-type": "application/json",
        }
        payload = {
            "audio_url": audio_url,
            "language_detection": True,
        }
        try:
            tr_resp = requests.post(create_url, headers=headers_json, json=payload, timeout=60)
        except requests.RequestException as e:
            return JsonResponse({"detail": "Transcript create error", "error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        if not (200 <= tr_resp.status_code < 300):
            try:
                tr_err = tr_resp.json()
            except Exception:
                tr_err = {"status": tr_resp.status_code, "body": tr_resp.text[:500]}
            return JsonResponse({"detail": "Transcript creation failed", "upstream": tr_err}, status=status.HTTP_502_BAD_GATEWAY)

        tr_json = tr_resp.json()
        transcript_id = tr_json.get('id')
        if not transcript_id:
            return JsonResponse({"detail": "No transcript id returned"}, status=status.HTTP_502_BAD_GATEWAY)

        # 3) Poll transcript until completed
        status_url = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        start = time.time()
        last_status: Optional[str] = None
        while True:
            try:
                s_resp = requests.get(status_url, headers={"authorization": aai_key}, timeout=30)
            except requests.RequestException as e:
                return JsonResponse({"detail": "Transcript status error", "error": str(e), "transcript_id": transcript_id}, status=status.HTTP_502_BAD_GATEWAY)

            if not (200 <= s_resp.status_code < 300):
                try:
                    s_err = s_resp.json()
                except Exception:
                    s_err = {"status": s_resp.status_code, "body": s_resp.text[:500]}
                return JsonResponse({"detail": "Transcript status failed", "upstream": s_err, "transcript_id": transcript_id}, status=status.HTTP_502_BAD_GATEWAY)

            s_json = s_resp.json()
            last_status = s_json.get('status')
            if last_status == 'completed':
                break
            if last_status == 'error':
                return JsonResponse({"detail": "Transcription error", "upstream": s_json, "transcript_id": transcript_id}, status=status.HTTP_502_BAD_GATEWAY)
            if time.time() - start > 600:  # 10 min timeout
                return JsonResponse({"detail": "Transcription timeout", "transcript_id": transcript_id, "status": last_status}, status=status.HTTP_504_GATEWAY_TIMEOUT)
            time.sleep(3)

        # 4) Fetch subtitles
        subs_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}/{out_format}"
        try:
            subs_resp = requests.get(subs_endpoint, headers={"authorization": aai_key}, timeout=60)
        except requests.RequestException as e:
            return JsonResponse({"detail": "Subtitles fetch error", "error": str(e), "transcript_id": transcript_id}, status=status.HTTP_502_BAD_GATEWAY)

        if not (200 <= subs_resp.status_code < 300):
            try:
                subs_err = subs_resp.json()
            except Exception:
                subs_err = {"status": subs_resp.status_code, "body": subs_resp.text[:500]}
            return JsonResponse({"detail": "Subtitles fetch failed", "upstream": subs_err, "transcript_id": transcript_id}, status=status.HTTP_502_BAD_GATEWAY)

        # Save subtitles next to the video
        subs_ext = '.srt' if out_format == 'srt' else '.vtt'
        base_name = Path(filename).stem
        subs_filename = f"{base_name}{subs_ext}"
        with open(base_dir / subs_filename, 'wb') as f:
            # subs_resp.text would be fine, but keep as bytes for safety
            content = subs_resp.content
            f.write(content)

        return JsonResponse({
            "subtitles_url": f"{settings.MEDIA_URL}{'generated/videos' if location=='generated' else 'uploads'}/{subs_filename}",
            "transcript_id": transcript_id,
            "format": out_format,
            "location": location,
        })


class EmbedSubtitlesView(APIView):
    """Create a new video file with subtitles embedded.

    Supports two modes:
    - method = 'soft': soft-mux the SRT into MP4 as a mov_text subtitle track
    - method = 'burn': burn the SRT into the video frames (hard subtitles)

    Request JSON:
      - filename: str (existing video filename)
      - location: 'generated' | 'uploads'
      - method: 'soft' | 'burn' (default 'burn')
      - format: 'srt' | 'vtt' (optional, SRT required for now)
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data or {}
        filename = data.get('filename')
        location = (data.get('location') or 'generated').lower()
        method = (data.get('method') or 'burn').lower()
        subs_format = (data.get('format') or 'srt').lower()

        if not filename or '/' in filename or '\\' in filename:
            return JsonResponse({"detail": "'filename' is required and must be a simple filename"}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve base dir
        base_dir = Path(settings.MEDIA_ROOT) / ('generated/videos' if location == 'generated' else 'uploads')
        video_path = (base_dir / filename).resolve()

        try:
            base_resolved = base_dir.resolve()
        except FileNotFoundError:
            base_dir.mkdir(parents=True, exist_ok=True)
            base_resolved = base_dir.resolve()

        if not str(video_path).startswith(str(base_resolved)):
            return JsonResponse({"detail": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)
        if not video_path.exists() or not video_path.is_file():
            return JsonResponse({"detail": "Video not found"}, status=status.HTTP_404_NOT_FOUND)

        # We currently require SRT for embedding; if VTT requested, check for SRT instead
        srt_path = video_path.with_suffix('.srt')
        if subs_format != 'srt' and not srt_path.exists():
            # Try SRT anyway if available
            pass
        if not srt_path.exists():
            return JsonResponse({"detail": "SRT file not found next to the video. Generate SRT first."}, status=status.HTTP_400_BAD_REQUEST)

        # Output path
        stem = video_path.stem
        if method == 'soft':
            out_name = f"{stem}_subtitled.mp4"
        else:
            out_name = f"{stem}_burned.mp4"
        out_path = base_dir / out_name

        # Locate ffmpeg (prefer bundled imageio-ffmpeg, else system ffmpeg)
        ffmpeg_path = 'ffmpeg'
        try:
            import imageio_ffmpeg  # type: ignore
            ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe() or ffmpeg_path
        except Exception:
            pass
        # Verify ffmpeg availability
        try:
            test_proc = subprocess.run([ffmpeg_path, '-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
            if test_proc.returncode != 0:
                raise RuntimeError('ffmpeg not available')
        except Exception:
            return JsonResponse({
                "detail": "ffmpeg not found. Please install ffmpeg or add imageio-ffmpeg to the environment.",
                "help": "pip install imageio-ffmpeg OR install ffmpeg and ensure it is on PATH",
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Build command
        if method == 'soft':
            # MP4 soft subtitles use mov_text; copy video/audio, transcode subs to mov_text
            # Re-encode video to ensure MP4 + H.264 compatibility
            cmd = [
                ffmpeg_path, '-y',
                '-sub_charenc', 'UTF-8',
                '-i', str(video_path),
                '-i', str(srt_path),
                '-map', '0:v', '-map', '0:a?', '-map', '1:0',
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                '-c:a', 'copy', '-c:s', 'mov_text',
                '-metadata:s:s:0', 'language=fr',
                str(out_path)
            ]
        else:
            # Burn SRT into frames; re-encode video, copy audio
            # Escape path for filter expression: escape backslashes and colons
            subs_escaped = str(srt_path).replace('\\', r'\\').replace(':', r'\:')
            filter_arg = f"subtitles={subs_escaped}"
            cmd = [
                ffmpeg_path, '-y',
                '-sub_charenc', 'UTF-8',
                '-i', str(video_path),
                '-vf', filter_arg,
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
                '-c:a', 'copy',
                str(out_path)
            ]

        try:
            proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
        except subprocess.TimeoutExpired:
            return JsonResponse({"detail": "ffmpeg timed out while embedding subtitles"}, status=status.HTTP_504_GATEWAY_TIMEOUT)
        except Exception as e:
            return JsonResponse({"detail": "ffmpeg error starting process", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        if proc.returncode != 0 or not out_path.exists():
            err_txt = proc.stderr.decode('utf-8', errors='ignore')[-2000:]
            return JsonResponse({"detail": "ffmpeg failed", "stderr": err_txt}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponse({
            'video_url': f"{settings.MEDIA_URL}{'generated/videos' if location=='generated' else 'uploads'}/{out_name}",
            'method': method,
            'source': filename,
        })


class UploadVideoView(APIView):
    """Upload a user-provided video to media/uploads and return its URL."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        video = request.FILES.get('video')
        if not video:
            return JsonResponse({"detail": "'video' file is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation by extension; rely on content-type loosely as browsers vary.
        allowed_ext = {'.mp4', '.webm', '.gif', '.mkv', '.mov', '.avi'}
        orig_name = getattr(video, 'name', 'upload')
        ext = Path(orig_name).suffix.lower() or '.mp4'
        if ext not in allowed_ext:
            return JsonResponse({"detail": f"Unsupported file type '{ext}'"}, status=status.HTTP_400_BAD_REQUEST)

        uploads_dir = Path(settings.MEDIA_ROOT) / 'uploads'
        uploads_dir.mkdir(parents=True, exist_ok=True)

        # Generate a safe filename to avoid collisions
        ts = int(time.time() * 1000)
        safe_base = Path(orig_name).stem.replace('/', '').replace('\\', '')[:80] or 'video'
        filename = f"{safe_base}_{ts}{ext}"
        file_path = uploads_dir / filename

        # Save file to disk
        try:
            with open(file_path, 'wb') as f:
                for chunk in video.chunks():
                    f.write(chunk)
        except Exception as e:
            return JsonResponse({"detail": f"Save failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            stat = file_path.stat()
        except OSError:
            stat = None

        return JsonResponse({
            'filename': filename,
            'video_url': f"{settings.MEDIA_URL}uploads/{filename}",
            'location': 'uploads',
            'size': getattr(stat, 'st_size', None),
            'created_at': int(getattr(stat, 'st_mtime', time.time())),
        })
