# editing_app/services/video_processor.py
import cv2
import numpy as np
import os
import tempfile
from django.core.files.base import ContentFile
import logging
from moviepy.editor import VideoFileClip
import whisper

logger = logging.getLogger(__name__)

class VideoProcessor:
    def __init__(self):
        self.effects = {
            'cinematic': self._apply_cinematic_effect,
            'vintage': self._apply_vintage_effect,
            'noir': self._apply_noir_effect,
            'dreamy': self._apply_dreamy_effect,
            'pop_art': self._apply_pop_art_effect,
        }
        # Charger le modèle de détection de visages
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def apply_video_effect(self, video_file, effect_name):
        """Applique un effet IA à une vidéo"""
        try:
            # Sauvegarder le fichier vidéo temporairement
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
                for chunk in video_file.chunks():
                    tmp_file.write(chunk)
                temp_path = tmp_file.name
            
            # Charger la vidéo
            clip = VideoFileClip(temp_path)
            
            # Appliquer l'effet
            if effect_name in self.effects:
                processed_clip = self.effects[effect_name](clip)
            else:
                processed_clip = clip
            
            # Sauvegarder le résultat
            output_path = tempfile.mktemp(suffix='.mp4')
            processed_clip.write_videofile(output_path, codec='libx264', audio_codec='aac', verbose=False, logger=None)
            
            # Lire le fichier résultat
            with open(output_path, 'rb') as f:
                video_content = ContentFile(f.read(), 'processed_video.mp4')
            
            # Nettoyer les fichiers temporaires
            os.unlink(temp_path)
            os.unlink(output_path)
            processed_clip.close()
            clip.close()
            
            return video_content
            
        except Exception as e:
            logger.error(f"Error applying video effect: {str(e)}")
            raise
    
    def detect_faces(self, video_file):
        """Détecte les visages dans la vidéo et analyse leur présence"""
        temp_path = None
        cap = None
        
        try:
            # Sauvegarder le fichier vidéo temporairement
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
                for chunk in video_file.chunks():
                    tmp_file.write(chunk)
                temp_path = tmp_file.name

            # Réinitialiser le pointeur du fichier
            video_file.seek(0)
            
            cap = cv2.VideoCapture(temp_path)
            face_data = []
            frame_count = 0
            fps = cap.get(cv2.CAP_PROP_FPS) or 30
            frame_interval = max(1, int(fps / 2))  # Analyser 2 fois par seconde
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Analyser seulement certains frames pour performance
                if frame_count % frame_interval == 0:
                    # Convertir en niveaux de gris pour la détection
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    
                    # Détecter les visages
                    faces = self.face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=5,
                        minSize=(30, 30)
                    )
                    
                    current_time = frame_count / fps
                    
                    # Analyser le nombre de visages
                    if len(faces) > 0:
                        face_data.append({
                            'timestamp': round(current_time, 2),
                            'face_count': len(faces),
                            'faces': [
                                {
                                    'x': int(x),
                                    'y': int(y),
                                    'width': int(w),
                                    'height': int(h)
                                }
                                for (x, y, w, h) in faces
                            ]
                        })
                    
                    logger.debug(f"Frame {frame_count}: {len(faces)} visages détectés")
                
                frame_count += 1
            
            # Analyser les patterns de présence des visages
            analysis = self._analyze_face_patterns(face_data)
            
            return {
                'face_detections': face_data,
                'analysis': analysis,
                'total_frames_analyzed': frame_count,
                'total_face_detections': len(face_data)
            }
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            raise Exception(f"Erreur lors de la détection des visages: {str(e)}")
        
        finally:
            # Nettoyage garanti
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
            if cap:
                try:
                    cap.release()
                except:
                    pass
    
    def _analyze_face_patterns(self, face_data):
        """Analyse les patterns de détection de visages"""
        if not face_data:
            return {
                'has_faces': False,
                'max_faces_simultaneous': 0,
                'face_presence_percentage': 0,
                'recommendations': []
            }
        
        # Calculer les métriques
        total_detections = len(face_data)
        max_faces = max([detection['face_count'] for detection in face_data]) if face_data else 0
        face_presence_percentage = (total_detections / max(1, len(face_data))) * 100
        
        # Générer des recommandations
        recommendations = []
        
        if max_faces == 0:
            recommendations.append("Aucun visage détecté dans la vidéo")
        elif max_faces == 1:
            recommendations.append("Vidéo centrée sur une personne - Parfait pour les interviews")
        elif max_faces == 2:
            recommendations.append("Dialogue détecté - Bon pour les conversations")
        else:
            recommendations.append(f"Groupe de {max_faces} personnes - Scène de groupe")
        
        if face_presence_percentage < 30:
            recommendations.append("Peu de présence humaine - Pensez à ajouter des plans rapprochés")
        elif face_presence_percentage > 80:
            recommendations.append("Forte présence humaine - Vidéo très personnelle")
        
        return {
            'has_faces': max_faces > 0,
            'max_faces_simultaneous': max_faces,
            'face_presence_percentage': round(face_presence_percentage, 2),
            'average_faces_per_detection': round(np.mean([d['face_count'] for d in face_data]), 2),
            'recommendations': recommendations,
            'timeline_summary': f"{total_detections} détections sur {len(face_data)} analyses"
        }
    
    def generate_subtitles(self, video_file, language='fr'):
        """Génère des sous-titres automatiques avec Whisper - Support FR/EN"""
        temp_path = None
        audio_temp = None
        video_clip = None
        
        try:
            # Sauvegarder le fichier vidéo temporairement
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_file:
                for chunk in video_file.chunks():
                    tmp_file.write(chunk)
                temp_path = tmp_file.name

            # Réinitialiser le pointeur du fichier
            video_file.seek(0)
            
            # Charger la vidéo et extraire l'audio
            video_clip = VideoFileClip(temp_path)
            
            # Vérifier si la vidéo a de l'audio
            if video_clip.audio is None:
                raise Exception("La vidéo ne contient pas de piste audio")
            
            audio_temp = tempfile.mktemp(suffix='.wav')
            video_clip.audio.write_audiofile(
                audio_temp, 
                verbose=False, 
                logger=None,
                fps=16000  # Fréquence d'échantillonnage standard pour Whisper
            )
            
            # Transcrire avec Whisper
            model = whisper.load_model("base")
            
            # Nettoyer le code de langue (enlever la partie région)
            clean_language = language.split('-')[0] if '-' in language else language
            
            # Vérifier les langues supportées - AJOUT DE L'ANGLAIS
            supported_languages = [
                'fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'zh', 
                'ar', 'hi', 'ko', 'tr', 'pl', 'sv', 'da', 'no', 'fi', 'el'
            ]
            
            if clean_language not in supported_languages:
                # Utiliser la détection automatique de langue
                logger.info(f"Langue non supportée: {clean_language}, utilisation de la détection automatique")
                result = model.transcribe(audio_temp)
            else:
                logger.info(f"Transcription en {clean_language}")
                result = model.transcribe(audio_temp, language=clean_language)
            
            # Formater les sous-titres
            subtitles = []
            for segment in result['segments']:
                subtitles.append({
                    'start': round(segment['start'], 2),
                    'end': round(segment['end'], 2),
                    'text': segment['text'].strip(),
                    'confidence': round(segment.get('confidence', 0), 3)
                })
            
            # Langue détectée (si détection automatique)
            detected_language = result.get('language', clean_language)
            
            return {
                'subtitles': subtitles,
                'language_detected': detected_language,
                'language_requested': clean_language
            }
            
        except Exception as e:
            logger.error(f"Error generating subtitles: {str(e)}")
            raise Exception(f"Erreur lors de la génération des sous-titres: {str(e)}")
        
        finally:
            # Nettoyage garanti
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except:
                    pass
            if audio_temp and os.path.exists(audio_temp):
                try:
                    os.unlink(audio_temp)
                except:
                    pass
            if video_clip:
                try:
                    video_clip.close()
                except:
                    pass
    
    # EFFETS VIDÉO - CORRIGÉS
    def _apply_cinematic_effect(self, clip):
        """Effet cinématique avec contraste augmenté"""
        def cinematic_filter(frame):
            # Augmenter le contraste
            frame = cv2.convertScaleAbs(frame, alpha=1.2, beta=10)
            # Teinte légèrement bleutée
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hsv[:, :, 0] = np.clip(hsv[:, :, 0] + 5, 0, 179)
            return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        
        return clip.fl_image(cinematic_filter)
    
    def _apply_vintage_effect(self, clip):
        """Effet vintage sépia"""
        def vintage_filter(frame):
            # Conversion sépia
            kernel = np.array([[0.272, 0.534, 0.131],
                              [0.349, 0.686, 0.168],
                              [0.393, 0.769, 0.189]])
            sepia = cv2.transform(frame, kernel)
            return np.clip(sepia, 0, 255).astype(np.uint8)
        
        return clip.fl_image(vintage_filter)
    
    def _apply_noir_effect(self, clip):
        """Effet film noir"""
        def noir_filter(frame):
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        
        return clip.fl_image(noir_filter)
    
    def _apply_dreamy_effect(self, clip):
        """Effet de rêve flou"""
        def dreamy_filter(frame):
            return cv2.GaussianBlur(frame, (15, 15), 0)
        
        return clip.fl_image(dreamy_filter)
    
    def _apply_pop_art_effect(self, clip):
        """Effet pop art"""
        def pop_art_filter(frame):
            # Augmenter la saturation
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255)
            return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        
        return clip.fl_image(pop_art_filter)