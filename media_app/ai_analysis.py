# media_app/ai_analysis.py
import cv2
import numpy as np
import tempfile
import os
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import librosa
import speech_recognition as sr
from PIL import Image
import json

class AdvancedMediaAnalyzer:
    def __init__(self):
        self.image_model = MobileNetV2(weights='imagenet')
        
    def analyze_media(self, file):
        """
        Comprehensive AI analysis for Module 2
        """
        name = file.name.lower()
        
        # Basic media type detection
        if any(ext in name for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            media_type = 'image'
            analysis = self._analyze_image(file)
        elif any(ext in name for ext in ['.mp4', '.mov', '.avi']):
            media_type = 'video'
            analysis = self._analyze_video(file)
        elif any(ext in name for ext in ['.mp3', '.wav', '.m4a']):
            media_type = 'audio'
            analysis = self._analyze_audio(file)
        else:
            media_type = 'inconnu'
            analysis = self._get_default_analysis()
            
        return media_type, analysis
    
    def _analyze_image(self, file):
        """Enhanced image analysis with object detection and facial analysis"""
        try:
            # Save temporary file
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            img_path = tmp.name
            
            # Read image with OpenCV
            img = cv2.imread(img_path)
            if img is None:
                return self._get_default_analysis()
                
            # Basic quality analysis
            quality_data = self._analyze_image_quality(img)
            
            # Object detection with CNN
            objects = self._detect_objects_cnn(img_path)
            
            # Face and emotion detection
            faces, emotions = self._detect_faces_and_emotions(img)
            
            # Scene context analysis
            scene_context = self._analyze_scene_context(objects)
            
            # Generate summary
            summary = self._generate_analysis_summary(objects, faces, emotions, scene_context)
            
            analysis_result = {
                'quality_score': quality_data['score'],
                'brightness': quality_data['brightness'],
                'sharpness': quality_data['sharpness'],
                'objects_detected': objects,
                'faces_detected': faces,
                'emotions': emotions,
                'scene_context': scene_context,
                'tags': [obj['label'] for obj in objects[:5]] + [scene_context],
                'theme': scene_context,
                'analysis_summary': summary
            }
            
            os.unlink(img_path)
            return analysis_result
            
        except Exception as e:
            print(f"Image analysis error: {e}")
            return self._get_default_analysis()
    
    def _analyze_video(self, file):
        """Basic video analysis (extract keyframe and analyze)"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            video_path = tmp.name
            
            # Extract first frame for analysis
            cap = cv2.VideoCapture(video_path)
            success, frame = cap.read()
            
            if success:
                # Save frame as temporary image
                frame_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
                cv2.imwrite(frame_path, frame)
                
                # Analyze the frame
                frame_file = open(frame_path, 'rb')
                analysis = self._analyze_image(frame_file)
                frame_file.close()
                
                os.unlink(frame_path)
            else:
                analysis = self._get_default_analysis()
                
            cap.release()
            os.unlink(video_path)
            return analysis
            
        except Exception as e:
            print(f"Video analysis error: {e}")
            return self._get_default_analysis()
    
    def _analyze_audio(self, file):
        """Audio analysis with speech recognition and feature extraction"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            audio_path = tmp.name
            
            # Load audio file
            y, sr = librosa.load(audio_path)
            
            # Extract audio features
            duration = librosa.get_duration(y=y, sr=sr)
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
            mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr), axis=1)
            
            # Try speech recognition
            transcript = self._transcribe_audio(audio_path)
            
            analysis_result = {
                'quality_score': 0.7,  # Placeholder
                'duration_seconds': duration,
                'tempo_bpm': tempo,
                'spectral_features': {
                    'centroid': float(spectral_centroid),
                    'mfcc_mean': [float(x) for x in mfcc[:5]]  # First 5 MFCCs
                },
                'transcript': transcript,
                'tags': ['audio', f'{duration:.1f}s', f'tempo_{tempo:.0f}bpm'],
                'theme': 'Audio Recording',
                'analysis_summary': f"Audio duration: {duration:.1f}s, Tempo: {tempo:.0f} BPM" + 
                                   (f", Transcript: {transcript[:100]}..." if transcript else "")
            }
            
            os.unlink(audio_path)
            return analysis_result
            
        except Exception as e:
            print(f"Audio analysis error: {e}")
            return self._get_default_analysis()
    
    def _analyze_image_quality(self, img):
        """Analyze image quality metrics"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Sharpness (variance of Laplacian)
        sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Brightness
        brightness = np.mean(gray) / 255.0
        
        # Contrast
        contrast = np.std(gray) / 255.0
        
        # Overall quality score (simplified)
        quality_score = min(sharpness / 500, 1.0) * 0.6 + brightness * 0.2 + contrast * 0.2
        
        return {
            'score': round(float(quality_score), 2),
            'sharpness': round(float(sharpness), 2),
            'brightness': round(float(brightness), 2),
            'contrast': round(float(contrast), 2)
        }
    
    def _detect_objects_cnn(self, image_path):
        """Detect objects using CNN"""
        try:
            img = image.load_img(image_path, target_size=(224, 224))
            x = image.img_to_array(img)
            x = np.expand_dims(x, axis=0)
            x = preprocess_input(x)
            
            preds = self.image_model.predict(x)
            decoded = decode_predictions(preds, top=10)[0]
            
            objects = []
            for _, label, score in decoded:
                if score > 0.1:  # Confidence threshold
                    objects.append({
                        'label': label,
                        'confidence': round(float(score), 3)
                    })
            
            return objects
        except Exception as e:
            print(f"Object detection error: {e}")
            return []
    
    def _detect_faces_and_emotions(self, img):
        """Basic face detection (emotion recognition would require additional models)"""
        try:
            # Load face detection model (you can replace with Haar cascades or DNN)
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            face_data = []
            for (x, y, w, h) in faces:
                face_data.append({
                    'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)},
                    'confidence': 0.8  # Placeholder
                })
            
            # Basic emotion placeholder (in real implementation, use FER model)
            emotions = [{'emotion': 'neutral', 'confidence': 0.9}] if len(face_data) > 0 else []
            
            return face_data, emotions
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return [], []
    
    def _analyze_scene_context(self, objects):
        """Determine scene context from detected objects"""
        if not objects:
            return "General"
        
        # Simple scene classification based on objects
        object_labels = [obj['label'] for obj in objects[:3]]
        labels_str = ' '.join(object_labels).lower()
        
        if any(word in labels_str for word in ['person', 'face', 'man', 'woman']):
            return "Portrait/People"
        elif any(word in labels_str for word in ['mountain', 'tree', 'sky', 'water']):
            return "Nature/Landscape"
        elif any(word in labels_str for word in ['building', 'street', 'city']):
            return "Urban/Architecture"
        elif any(word in labels_str for word in ['car', 'bus', 'truck', 'road']):
            return "Transportation"
        else:
            return "General"
    
    def _transcribe_audio(self, audio_path):
        """Transcribe audio to text"""
        try:
            r = sr.Recognizer()
            with sr.AudioFile(audio_path) as source:
                audio = r.record(source)
            return r.recognize_google(audio, language='fr-FR')
        except:
            return ""  # Return empty if transcription fails
    
    def _generate_analysis_summary(self, objects, faces, emotions, scene_context):
        """Generate human-readable analysis summary"""
        summary_parts = []
        
        if objects:
            top_objects = [obj['label'] for obj in objects[:3]]
            summary_parts.append(f"Objets détectés: {', '.join(top_objects)}")
        
        if faces:
            summary_parts.append(f"{len(faces)} visage(s) détecté(s)")
        
        if emotions:
            summary_parts.append(f"Émotion principale: {emotions[0]['emotion']}")
        
        summary_parts.append(f"Contexte: {scene_context}")
        
        return ". ".join(summary_parts) if summary_parts else "Analyse de base effectuée"
    
    def _get_default_analysis(self):
        """Return default analysis when AI fails"""
        return {
            'quality_score': 0.5,
            'brightness': 0.5,
            'sharpness': 0.5,
            'objects_detected': [],
            'faces_detected': [],
            'emotions': [],
            'scene_context': 'General',
            'tags': ['media'],
            'theme': 'General',
            'analysis_summary': 'Analyse basique effectuée'
        }