# media_app/advanced_ai_analyzer.py
import cv2
import numpy as np
import tempfile
import os
import librosa
import speech_recognition as sr
from PIL import Image

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    print("YOLOv8 not available, using fallback object detection")
    YOLO_AVAILABLE = False

try:
    from fer import FER
    FER_AVAILABLE = True
except ImportError:
    print("FER not available, using fallback emotion detection")
    FER_AVAILABLE = False

class AdvancedAIAnalyzer:
    def __init__(self):
        # Load YOLOv8 model for object detection
        self.yolo_model = None
        if YOLO_AVAILABLE:
            try:
                self.yolo_model = YOLO('yolov8n.pt')  # Automatically downloads
                print("YOLOv8 model loaded successfully")
            except Exception as e:
                print(f"YOLOv8 loading error: {e}")
        
        # Load Facial Emotion Recognition model
        self.emotion_detector = None
        if FER_AVAILABLE:
            try:
                self.emotion_detector = FER(mtcnn=True)
                print("FER model loaded successfully")
            except Exception as e:
                print(f"FER loading error: {e}")
        
        # Audio analysis parameters
        self.sample_rate = 22050
        self.n_mfcc = 13
        
    def analyze_media(self, file):
        """
        Comprehensive AI analysis using YOLOv8, FER, and advanced features
        """
        name = file.name.lower()
        
        if any(ext in name for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            media_type = 'image'
            analysis = self._analyze_image_advanced(file)
        elif any(ext in name for ext in ['.mp4', '.mov', '.avi']):
            media_type = 'video'
            analysis = self._analyze_video_advanced(file)
        elif any(ext in name for ext in ['.mp3', '.wav', '.m4a', '.flac']):
            media_type = 'audio'
            analysis = self._analyze_audio_advanced(file)
        else:
            media_type = 'inconnu'
            analysis = self._get_default_analysis()
            
        return media_type, analysis
    
    def _analyze_image_advanced(self, file):
        """Advanced image analysis with YOLOv8 and FER"""
        try:
            # Save temporary file
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            img_path = tmp.name
            
            # Read image
            img = cv2.imread(img_path)
            if img is None:
                return self._get_default_analysis()
            
            # Basic quality analysis
            quality_data = self._analyze_image_quality(img)
            
            # 🎯 YOLOv8 Object Detection
            objects_detected = self._detect_objects_yolov8(img_path)
            
            # 😊 Facial Emotion Recognition
            faces_detected, emotions = self._detect_faces_emotions_fer(img)
            
            # 🏞️ Scene context analysis
            scene_context = self._analyze_scene_context_advanced(objects_detected, faces_detected)
            
            # 📊 Generate comprehensive analysis
            analysis_summary = self._generate_detailed_summary(objects_detected, faces_detected, emotions, scene_context)
            
            # 🏷️ Tags from detected objects and emotions
            tags = self._generate_tags(objects_detected, emotions, scene_context)
            
            analysis_result = {
                'quality_score': quality_data['score'],
                'brightness': quality_data['brightness'],
                'sharpness': quality_data['sharpness'],
                'contrast': quality_data['contrast'],
                'objects_detected': objects_detected,
                'faces_detected': faces_detected,
                'emotions': emotions,
                'scene_context': scene_context,
                'tags': tags,
                'theme': scene_context,
                'analysis_summary': analysis_summary,
                'ai_models_used': ['YOLOv8', 'FER', 'OpenCV'] if self.yolo_model or self.emotion_detector else ['OpenCV']
            }
            
            os.unlink(img_path)
            return analysis_result
            
        except Exception as e:
            print(f"Advanced image analysis error: {e}")
            return self._get_default_analysis()
    
    def _detect_objects_yolov8(self, image_path):
        """Object detection using YOLOv8"""
        objects = []
        try:
            if self.yolo_model is None:
                # Fallback to basic object detection
                return self._detect_objects_basic(image_path)
                
            # Run YOLOv8 inference
            results = self.yolo_model(image_path)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Get object details
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        confidence = float(box.conf[0])
                        
                        # Get bounding box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        
                        if confidence > 0.3:  # Confidence threshold
                            objects.append({
                                'label': class_name,
                                'confidence': round(confidence, 3),
                                'bbox': {
                                    'x1': round(x1), 'y1': round(y1),
                                    'x2': round(x2), 'y2': round(y2)
                                },
                                'area': round((x2 - x1) * (y2 - y1))
                            })
            
            # Sort by confidence
            objects.sort(key=lambda x: x['confidence'], reverse=True)
            
        except Exception as e:
            print(f"YOLOv8 detection error: {e}")
            # Fallback to basic detection
            objects = self._detect_objects_basic(image_path)
            
        return objects
    
    def _detect_objects_basic(self, image_path):
        """Fallback basic object detection using OpenCV and color analysis"""
        objects = []
        try:
            img = cv2.imread(image_path)
            if img is None:
                return objects
                
            # Simple color-based object detection (placeholder)
            # In a real scenario, you'd use Haar cascades or other methods
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Detect different color ranges
            color_ranges = [
                ('red', np.array([0, 120, 70]), np.array([10, 255, 255])),
                ('blue', np.array([100, 150, 0]), np.array([140, 255, 255])),
                ('green', np.array([40, 40, 40]), np.array([80, 255, 255])),
            ]
            
            for color_name, lower, upper in color_ranges:
                mask = cv2.inRange(hsv, lower, upper)
                if np.sum(mask) > 1000:  # If significant area of this color
                    objects.append({
                        'label': f'{color_name}_object',
                        'confidence': 0.5,
                        'bbox': {'x1': 0, 'y1': 0, 'x2': img.shape[1], 'y2': img.shape[0]},
                        'area': img.shape[0] * img.shape[1]
                    })
            
        except Exception as e:
            print(f"Basic object detection error: {e}")
            
        return objects
    
    def _detect_faces_emotions_fer(self, img):
        """Facial emotion detection using FER"""
        faces_detected = []
        emotions = []
        
        try:
            if self.emotion_detector is None:
                # Fallback to basic face detection
                return self._detect_faces_basic(img), emotions
            
            # Convert BGR to RGB for FER
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Detect emotions
            emotion_results = self.emotion_detector.detect_emotions(img_rgb)
            
            for result in emotion_results:
                box = result['box']
                emotions_data = result['emotions']
                
                # Get dominant emotion
                dominant_emotion = max(emotions_data.items(), key=lambda x: x[1])
                
                faces_detected.append({
                    'position': {
                        'x': box[0], 'y': box[1],
                        'width': box[2], 'height': box[3]
                    },
                    'confidence': round(dominant_emotion[1], 3)
                })
                
                emotions.append({
                    'emotion': dominant_emotion[0],
                    'confidence': round(dominant_emotion[1], 3),
                    'all_emotions': emotions_data
                })
                
        except Exception as e:
            print(f"FER emotion detection error: {e}")
            # Fallback to basic face detection
            faces_detected = self._detect_faces_basic(img)
            
        return faces_detected, emotions
    
    def _detect_faces_basic(self, img):
        """Basic face detection using OpenCV Haar cascades"""
        faces_detected = []
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            for (x, y, w, h) in faces:
                faces_detected.append({
                    'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)},
                    'confidence': 0.8
                })
                
        except Exception as e:
            print(f"Basic face detection error: {e}")
            
        return faces_detected
    
    def _analyze_audio_advanced(self, file):
        """Advanced audio analysis with spectral features"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            audio_path = tmp.name
            
            # Load audio file
            y, sr = librosa.load(audio_path, sr=self.sample_rate)
            
            # Basic audio features
            duration = librosa.get_duration(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Advanced audio features
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=self.n_mfcc)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)
            
            # Statistical features
            mfcc_mean = np.mean(mfccs, axis=1)
            mfcc_std = np.std(mfccs, axis=1)
            
            # Audio classification
            audio_type = self._classify_audio_type(mfccs, spectral_centroid, zero_crossing_rate)
            
            # Speech recognition
            transcript = self._transcribe_audio(audio_path)
            
            # Emotion from audio
            audio_emotion = self._analyze_audio_emotion(mfccs, spectral_centroid)
            
            analysis_result = {
                'quality_score': 0.8,
                'duration_seconds': round(duration, 2),
                'tempo_bpm': round(tempo, 2),
                'audio_type': audio_type,
                'audio_emotion': audio_emotion,
                'transcript': transcript,
                'spectral_features': {
                    'mfcc_mean': [float(x) for x in mfcc_mean[:5]],
                    'mfcc_std': [float(x) for x in mfcc_std[:5]],
                    'spectral_centroid_mean': float(np.mean(spectral_centroid)),
                    'zero_crossing_rate': float(np.mean(zero_crossing_rate))
                },
                'tags': self._generate_audio_tags(audio_type, duration, tempo, transcript),
                'theme': f"{audio_type} - {audio_emotion}",
                'analysis_summary': f"Audio {audio_type}, durée: {duration:.1f}s, tempo: {tempo:.0f} BPM, émotion: {audio_emotion}",
                'ai_models_used': ['Librosa', 'Spectral-Analysis', 'SpeechRecognition']
            }
            
            os.unlink(audio_path)
            return analysis_result
            
        except Exception as e:
            print(f"Advanced audio analysis error: {e}")
            return self._get_default_analysis()
    
    def _analyze_video_advanced(self, file):
        """Advanced video analysis with frame sampling"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            video_path = tmp.name
            
            # Open video
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            # Sample frames for analysis
            frame_analyses = []
            sample_rate = max(1, total_frames // 10)  # Analyze ~10 frames
            
            for frame_idx in range(0, total_frames, sample_rate):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                success, frame = cap.read()
                
                if success:
                    # Save frame as temporary image
                    frame_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
                    cv2.imwrite(frame_path, frame)
                    
                    # Analyze the frame
                    frame_file = open(frame_path, 'rb')
                    frame_analysis = self._analyze_image_advanced(frame_file)
                    frame_file.close()
                    
                    frame_analyses.append(frame_analysis)
                    os.unlink(frame_path)
            
            cap.release()
            os.unlink(video_path)
            
            # Aggregate frame analyses
            if frame_analyses:
                return self._aggregate_video_analysis(frame_analyses, total_frames, fps)
            else:
                return self._get_default_analysis()
                
        except Exception as e:
            print(f"Advanced video analysis error: {e}")
            return self._get_default_analysis()
    
    def _classify_audio_type(self, mfccs, spectral_centroid, zero_crossing_rate):
        """Simple audio type classification"""
        try:
            sc_mean = np.mean(spectral_centroid)
            zcr_mean = np.mean(zero_crossing_rate)
            
            if zcr_mean > 0.1:
                return "Speech"
            elif sc_mean > 2000:
                return "Music"
            else:
                return "Ambient"
        except:
            return "Audio"
    
    def _analyze_audio_emotion(self, mfccs, spectral_centroid):
        """Simple audio emotion analysis"""
        try:
            sc_mean = np.mean(spectral_centroid)
            mfcc_var = np.var(mfccs)
            
            if sc_mean > 3000 and mfcc_var > 10:
                return "Energetic"
            elif sc_mean < 1500 and mfcc_var < 5:
                return "Calm"
            else:
                return "Neutral"
        except:
            return "Neutral"
    
    def _analyze_scene_context_advanced(self, objects, faces):
        """Advanced scene context analysis"""
        if not objects and not faces:
            return "General"
        
        object_labels = [obj['label'] for obj in objects[:5]]
        object_str = ' '.join(object_labels).lower()
        
        # Person-related scenes
        if faces:
            if len(faces) > 3:
                return "Group Portrait"
            else:
                return "Portrait"
        
        # Object-based scenes
        if any(obj in object_str for obj in ['car', 'bus', 'truck', 'motorcycle']):
            return "Transportation"
        elif any(obj in object_str for obj in ['building', 'house', 'skyscraper']):
            return "Architecture"
        elif any(obj in object_str for obj in ['tree', 'grass', 'mountain', 'sky']):
            return "Nature"
        elif any(obj in object_str for obj in ['computer', 'keyboard', 'mouse', 'monitor']):
            return "Office"
        elif any(obj in object_str for obj in ['book', 'chair', 'table', 'cup']):
            return "Indoor"
        else:
            return "General"
    
    def _generate_tags(self, objects, emotions, scene_context):
        """Generate comprehensive tags"""
        tags = []
        
        # Object tags
        for obj in objects[:5]:
            tags.append(obj['label'])
        
        # Emotion tags
        for emotion in emotions[:2]:
            tags.append(emotion['emotion'])
        
        # Scene context tag
        tags.append(scene_context.lower())
        
        # Quality tags
        tags.extend(['ai_analyzed', 'computer_vision'])
        
        return list(set(tags))[:10]  # Remove duplicates and limit
    
    def _generate_audio_tags(self, audio_type, duration, tempo, transcript):
        """Generate audio-specific tags"""
        tags = [audio_type.lower(), 'audio']
        
        if duration > 60:
            tags.append('long')
        else:
            tags.append('short')
            
        if tempo > 120:
            tags.append('fast')
        elif tempo < 80:
            tags.append('slow')
            
        if transcript:
            tags.append('speech')
        else:
            tags.append('non_speech')
            
        return tags
    
    def _aggregate_video_analysis(self, frame_analyses, total_frames, fps):
        """Aggregate analysis from multiple video frames"""
        main_analysis = frame_analyses[0]  # Use first frame as base
        
        # Aggregate objects from all frames
        all_objects = []
        all_faces = []
        all_emotions = []
        
        for analysis in frame_analyses:
            all_objects.extend(analysis.get('objects_detected', []))
            all_faces.extend(analysis.get('faces_detected', []))
            all_emotions.extend(analysis.get('emotions', []))
        
        # Remove duplicates and sort by confidence
        main_analysis['objects_detected'] = sorted(all_objects, key=lambda x: x['confidence'], reverse=True)[:10]
        main_analysis['faces_detected'] = sorted(all_faces, key=lambda x: x['confidence'], reverse=True)[:5]
        main_analysis['emotions'] = sorted(all_emotions, key=lambda x: x['confidence'], reverse=True)[:3]
        
        # Update summary for video
        main_analysis['analysis_summary'] = f"Video analysis: {total_frames} frames, {fps:.1f} FPS. " + main_analysis['analysis_summary']
        main_analysis['ai_models_used'].append('Video-Sampling')
        
        return main_analysis
    
    def _analyze_image_quality(self, img):
        """Analyze image quality metrics"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Sharpness (variance of Laplacian)
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Brightness
        brightness = np.mean(gray) / 255.0
        
        # Contrast
        contrast = np.std(gray) / 255.0
        
        # Overall quality score
        quality_score = min(sharpness / 500, 1.0) * 0.6 + brightness * 0.2 + contrast * 0.2
        
        return {
            'score': round(float(quality_score), 2),
            'sharpness': round(float(sharpness), 2),
            'brightness': round(float(brightness), 2),
            'contrast': round(float(contrast), 2)
        }
    
    def _transcribe_audio(self, audio_path):
        """Transcribe audio to text"""
        try:
            r = sr.Recognizer()
            with sr.AudioFile(audio_path) as source:
                audio = r.record(source)
            return r.recognize_google(audio, language='fr-FR')
        except:
            return ""
    
    def _generate_detailed_summary(self, objects, faces, emotions, scene_context):
        """Generate detailed analysis summary"""
        summary_parts = []
        
        if objects:
            top_objects = [obj['label'] for obj in objects[:3]]
            summary_parts.append(f"🎯 Objets: {', '.join(top_objects)}")
        
        if faces:
            summary_parts.append(f"😊 {len(faces)} visage(s) détecté(s)")
        
        if emotions:
            top_emotion = emotions[0]
            summary_parts.append(f"🎭 Émotion dominante: {top_emotion['emotion']} ({top_emotion['confidence']*100:.0f}%)")
        
        summary_parts.append(f"🏞️ Contexte: {scene_context}")
        
        # Indicate which models were used
        if self.yolo_model and self.emotion_detector:
            summary_parts.append("🤖 Analyse par YOLOv8 & FER")
        elif self.yolo_model:
            summary_parts.append("🤖 Analyse par YOLOv8")
        elif self.emotion_detector:
            summary_parts.append("🤖 Analyse par FER")
        else:
            summary_parts.append("🤖 Analyse basique")
        
        return ". ".join(summary_parts)
    
    def _get_default_analysis(self):
        """Return default analysis when AI fails"""
        return {
            'quality_score': 0.5,
            'brightness': 0.5,
            'sharpness': 0.5,
            'contrast': 0.5,
            'objects_detected': [],
            'faces_detected': [],
            'emotions': [],
            'scene_context': 'General',
            'tags': ['media'],
            'theme': 'General',
            'analysis_summary': 'Analyse basique effectuée',
            'ai_models_used': ['Basic']
        }