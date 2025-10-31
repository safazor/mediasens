# media_app/advanced_ai_service.py
import cv2
import numpy as np
import tempfile
import os
import librosa
import speech_recognition as sr
from PIL import Image
import json
from datetime import datetime
import random

# Import additional AI libraries
try:
    import tensorflow as tf
    from tensorflow.keras.applications import EfficientNetB0
    from tensorflow.keras.applications.efficientnet import preprocess_input as eff_preprocess
    TENSORFLOW_AVAILABLE = True
except ImportError:
    print("❌ TensorFlow not available")
    TENSORFLOW_AVAILABLE = False

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError:
    print("❌ DeepFace not available")
    DEEPFACE_AVAILABLE = False

try:
    from transformers import pipeline, AutoImageProcessor, AutoModelForImageClassification
    from transformers import WhisperProcessor, WhisperForConditionalGeneration
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    print("❌ Transformers not available")
    TRANSFORMERS_AVAILABLE = False

try:
    import torch
    import torchvision
    TORCH_AVAILABLE = True
except ImportError:
    print("❌ PyTorch not available")
    TORCH_AVAILABLE = False

try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    print("❌ PyDub not available")
    PYDUB_AVAILABLE = False

class AdvancedAIService:
    def __init__(self):
        self.models_loaded = False
        self.ai_models = {}
        self.load_models()
    
    def load_models(self):
        """Load all available AI models"""
        try:
            print("🚀 Loading AI models...")
            
            # 🎯 Computer Vision Models
            self._load_computer_vision_models()
            
            # 😊 Facial Analysis Models
            self._load_facial_analysis_models()
            
            # 🎵 Audio Analysis Models
            self._load_audio_analysis_models()
            
            # 🏞️ Scene Understanding Models
            self._load_scene_understanding_models()
            
            print("✅ All AI models loaded successfully")
            self.models_loaded = True
            
        except Exception as e:
            print(f"❌ Error loading AI models: {e}")
            self.models_loaded = False
    
    def _load_computer_vision_models(self):
        """Load computer vision models"""
        # YOLO for object detection
        try:
            from ultralytics import YOLO
            self.ai_models['yolo'] = YOLO('yolov8n.pt')
            print("✅ YOLOv8 model loaded")
        except ImportError:
            print("❌ YOLOv8 not available")
            self.ai_models['yolo'] = None
        
        # TensorFlow EfficientNet for image classification
        if TENSORFLOW_AVAILABLE:
            try:
                self.ai_models['efficientnet'] = EfficientNetB0(weights='imagenet')
                print("✅ EfficientNet model loaded")
            except Exception as e:
                print(f"❌ EfficientNet loading error: {e}")
        
        # Transformers for advanced image classification
        if TRANSFORMERS_AVAILABLE:
            try:
                self.ai_models['image_processor'] = AutoImageProcessor.from_pretrained("microsoft/resnet-50")
                self.ai_models['image_classifier'] = AutoModelForImageClassification.from_pretrained("microsoft/resnet-50")
                print("✅ ResNet-50 transformer model loaded")
            except Exception as e:
                print(f"❌ Transformer image model loading error: {e}")
    
    def _load_facial_analysis_models(self):
        """Load facial analysis models"""
        if DEEPFACE_AVAILABLE:
            try:
                # DeepFace will load models on-demand
                print("✅ DeepFace available for facial analysis")
            except Exception as e:
                print(f"❌ DeepFace loading error: {e}")
        
        # OpenCV face detection as fallback
        try:
            self.ai_models['face_cascade'] = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            print("✅ OpenCV face detection loaded")
        except Exception as e:
            print(f"❌ OpenCV face detection error: {e}")
    
    def _load_audio_analysis_models(self):
        """Load audio analysis models"""
        if TRANSFORMERS_AVAILABLE:
            try:
                # Whisper for speech recognition
                self.ai_models['whisper_processor'] = WhisperProcessor.from_pretrained("openai/whisper-small")
                self.ai_models['whisper_model'] = WhisperForConditionalGeneration.from_pretrained("openai/whisper-small")
                print("✅ Whisper speech recognition model loaded")
            except Exception as e:
                print(f"❌ Whisper loading error: {e}")
        
        # Audio emotion analysis pipeline
        if TRANSFORMERS_AVAILABLE:
            try:
                self.ai_models['audio_emotion'] = pipeline(
                    "audio-classification", 
                    model="superb/wav2vec2-base-superb-er"
                )
                print("✅ Audio emotion recognition model loaded")
            except Exception as e:
                print(f"❌ Audio emotion model loading error: {e}")
    
    def _load_scene_understanding_models(self):
        """Load scene understanding models"""
        if TRANSFORMERS_AVAILABLE:
            try:
                self.ai_models['scene_classifier'] = pipeline(
                    "image-classification", 
                    model="microsoft/resnet-50"
                )
                print("✅ Scene classification model loaded")
            except Exception as e:
                print(f"❌ Scene classifier loading error: {e}")
    
    def analyze_media(self, file):
        """Comprehensive AI analysis using all available models"""
        filename = file.name.lower()
        
        if any(ext in filename for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
            return self.analyze_image_advanced(file)
        elif any(ext in filename for ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']):
            return self.analyze_video_advanced(file)
        elif any(ext in filename for ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg']):
            return self.analyze_audio_advanced(file)
        else:
            return self.get_basic_analysis(file)
    
    def analyze_image_advanced(self, file):
        """Advanced image analysis using multiple AI models"""
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
                return self.get_basic_analysis(file)
            
            # Run comprehensive analysis with all available models
            analysis = {
                'media_type': 'image',
                'quality_metrics': self.analyze_image_quality_advanced(img),
                'objects_detected': self.detect_objects_multimodel(img_path),
                'face_analysis': self.analyze_faces_deepface(img),
                'scene_analysis': self.analyze_scene_transformers(img_path),
                'color_analysis': self.analyze_colors_advanced(img),
                'image_classification': self.classify_image_tensorflow(img_path),
                'technical_metadata': self.get_technical_metadata(img),
                'ai_models_used': self.get_used_models(),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            # Generate comprehensive summary and tags
            analysis['summary'] = self.generate_comprehensive_summary(analysis)
            analysis['tags'] = self.generate_advanced_tags(analysis)
            analysis['theme'] = self.determine_advanced_theme(analysis)
            analysis['quality_score'] = analysis['quality_metrics']['overall_score']
            
            os.unlink(img_path)
            return analysis
            
        except Exception as e:
            print(f"Advanced image analysis error: {e}")
            return self.get_basic_analysis(file)
    
    def detect_objects_multimodel(self, image_path):
        """Object detection using multiple models (YOLO + Transformers)"""
        objects = []
        
        # YOLO detection
        if self.ai_models.get('yolo'):
            objects.extend(self.detect_objects_yolo(image_path))
        
        # Transformer-based detection
        if self.ai_models.get('scene_classifier'):
            objects.extend(self.detect_objects_transformers(image_path))
        
        # Remove duplicates and sort by confidence
        unique_objects = {}
        for obj in objects:
            label = obj['label']
            if label not in unique_objects or obj['confidence'] > unique_objects[label]['confidence']:
                unique_objects[label] = obj
        
        return sorted(unique_objects.values(), key=lambda x: x['confidence'], reverse=True)[:15]
    
    def detect_objects_yolo(self, image_path):
        """Object detection with YOLOv8"""
        objects = []
        try:
            results = self.ai_models['yolo'](image_path)
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        class_id = int(box.cls[0])
                        class_name = result.names[class_id]
                        confidence = float(box.conf[0])
                        
                        if confidence > 0.3:
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            
                            objects.append({
                                'label': class_name,
                                'confidence': round(confidence, 3),
                                'bbox': [round(x1), round(y1), round(x2), round(y2)],
                                'area': round((x2 - x1) * (y2 - y1)),
                                'model': 'YOLOv8'
                            })
            
            return objects
            
        except Exception as e:
            print(f"YOLO detection error: {e}")
            return []
    
    def detect_objects_transformers(self, image_path):
        """Object/scene detection using transformer models"""
        objects = []
        try:
            classifier = self.ai_models['scene_classifier']
            results = classifier(image_path)
            
            for result in results[:5]:  # Top 5 predictions
                objects.append({
                    'label': result['label'],
                    'confidence': round(result['score'], 3),
                    'bbox': None,  # Transformers don't provide bbox
                    'area': 0,
                    'model': 'Transformers'
                })
            
            return objects
            
        except Exception as e:
            print(f"Transformer detection error: {e}")
            return []
    
    def analyze_faces_deepface(self, img):
        """Advanced facial analysis using DeepFace"""
        faces = []
        
        if not DEEPFACE_AVAILABLE:
            return self.detect_faces_opencv(img)
        
        try:
            # Convert BGR to RGB for DeepFace
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Analyze faces with multiple attributes
            analyses = DeepFace.analyze(
                img_path=img_rgb,
                actions=['age', 'gender', 'emotion', 'race'],
                enforce_detection=False,
                detector_backend='opencv'
            )
            
            for analysis in analyses:
                face_data = {
                    'age': analysis.get('age', 'Unknown'),
                    'gender': analysis.get('dominant_gender', 'Unknown'),
                    'emotion': analysis.get('dominant_emotion', 'neutral'),
                    'race': analysis.get('dominant_race', 'Unknown'),
                    'confidence': analysis.get('face_confidence', 0.7),
                    'region': analysis.get('region', {}),
                    'emotion_breakdown': analysis.get('emotion', {}),
                    'model': 'DeepFace'
                }
                faces.append(face_data)
            
            return faces
            
        except Exception as e:
            print(f"DeepFace analysis error: {e}")
            return self.detect_faces_opencv(img)
    
    def analyze_scene_transformers(self, image_path):
        """Advanced scene analysis using transformers"""
        try:
            if not self.ai_models.get('scene_classifier'):
                return {'primary_scene': 'General', 'confidence': 0.5}
            
            classifier = self.ai_models['scene_classifier']
            results = classifier(image_path)
            
            return {
                'primary_scene': results[0]['label'],
                'confidence': round(results[0]['score'], 3),
                'alternative_scenes': [
                    {'scene': r['label'], 'confidence': round(r['score'], 3)}
                    for r in results[1:4]
                ],
                'model': 'Transformers'
            }
            
        except Exception as e:
            print(f"Scene analysis error: {e}")
            return {'primary_scene': 'General', 'confidence': 0.5}
    
    def classify_image_tensorflow(self, image_path):
        """Image classification using TensorFlow models"""
        try:
            if not TENSORFLOW_AVAILABLE:
                return {}
            
            # Load and preprocess image
            img = tf.keras.preprocessing.image.load_img(image_path, target_size=(224, 224))
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            img_array = tf.expand_dims(img_array, 0)
            img_array = eff_preprocess(img_array)
            
            # Predict
            predictions = self.ai_models['efficientnet'](img_array)
            decoded_predictions = tf.keras.applications.efficientnet.decode_predictions(
                predictions.numpy()
            )[0]
            
            return {
                'predictions': [
                    {'label': label, 'confidence': round(float(score), 4)}
                    for (_, label, score) in decoded_predictions[:5]
                ],
                'model': 'EfficientNet'
            }
            
        except Exception as e:
            print(f"TensorFlow classification error: {e}")
            return {}
    
    def analyze_audio_advanced(self, file):
        """Advanced audio analysis with multiple models"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            audio_path = tmp.name
            
            # Convert to WAV if needed
            if PYDUB_AVAILABLE and not audio_path.lower().endswith('.wav'):
                audio = AudioSegment.from_file(audio_path)
                wav_path = audio_path + '.wav'
                audio.export(wav_path, format='wav')
                os.unlink(audio_path)
                audio_path = wav_path
            
            # Comprehensive audio analysis
            analysis = {
                'media_type': 'audio',
                'basic_features': self.analyze_audio_features(audio_path),
                'speech_analysis': self.analyze_speech_whisper(audio_path),
                'emotion_analysis': self.analyze_audio_emotion(audio_path),
                'music_analysis': self.analyze_music_features(audio_path),
                'ai_models_used': self.get_used_models(),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            # Generate summary and tags
            analysis['summary'] = self.generate_audio_summary(analysis)
            analysis['tags'] = self.generate_audio_tags(analysis)
            analysis['theme'] = self.determine_audio_theme(analysis)
            analysis['quality_score'] = analysis['basic_features'].get('quality_score', 0.6)
            
            os.unlink(audio_path)
            return analysis
            
        except Exception as e:
            print(f"Advanced audio analysis error: {e}")
            return self.get_basic_analysis(file)
    
    def analyze_speech_whisper(self, audio_path):
        """Speech recognition using Whisper"""
        try:
            if not self.ai_models.get('whisper_processor'):
                return {'transcript': '', 'language': 'unknown'}
            
            # Load audio
            audio, sr = librosa.load(audio_path, sr=16000)
            
            # Process with Whisper
            processor = self.ai_models['whisper_processor']
            model = self.ai_models['whisper_model']
            
            input_features = processor(audio, sampling_rate=sr, return_tensors="pt").input_features
            predicted_ids = model.generate(input_features)
            transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)
            
            return {
                'transcript': transcription[0] if transcription else '',
                'language': 'auto-detected',
                'model': 'Whisper'
            }
            
        except Exception as e:
            print(f"Whisper speech recognition error: {e}")
            return {'transcript': self._transcribe_audio_basic(audio_path), 'language': 'fr-FR'}
    
    def analyze_audio_emotion(self, audio_path):
        """Audio emotion recognition"""
        try:
            if not self.ai_models.get('audio_emotion'):
                return {'emotion': 'neutral', 'confidence': 0.5}
            
            classifier = self.ai_models['audio_emotion']
            result = classifier(audio_path)
            
            return {
                'emotion': result[0]['label'],
                'confidence': round(result[0]['score'], 3),
                'all_emotions': result[:3],
                'model': 'Wav2Vec2'
            }
            
        except Exception as e:
            print(f"Audio emotion analysis error: {e}")
            return {'emotion': 'neutral', 'confidence': 0.5}
    
    def analyze_audio_features(self, audio_path):
        """Comprehensive audio feature extraction"""
        try:
            y, sr = librosa.load(audio_path, sr=22050)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Advanced audio features
            features = {
                'duration_seconds': round(duration, 2),
                'tempo_bpm': round(librosa.beat.beat_track(y=y, sr=sr)[0], 2),
                'spectral_centroid': float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
                'spectral_rolloff': float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))),
                'zero_crossing_rate': float(np.mean(librosa.feature.zero_crossing_rate(y))),
                'rms_energy': float(np.mean(librosa.feature.rms(y=y))),
                'mfcc_features': [float(x) for x in np.mean(librosa.feature.mfcc(y=y, sr=sr), axis=1)[:5]],
                'chroma_features': [float(x) for x in np.mean(librosa.feature.chroma_stft(y=y, sr=sr), axis=1)[:3]]
            }
            
            # Quality score based on audio characteristics
            features['quality_score'] = self.calculate_audio_quality(features)
            
            return features
            
        except Exception as e:
            print(f"Audio feature analysis error: {e}")
            return {'duration_seconds': 0, 'quality_score': 0.5}
    
    def analyze_music_features(self, audio_path):
        """Music-specific analysis"""
        try:
            y, sr = librosa.load(audio_path, sr=22050)
            
            return {
                'key': self.estimate_key(y, sr),
                'chord_analysis': self.analyze_chords(y, sr),
                'beat_strength': float(np.mean(librosa.beat.beat_track(y=y, sr=sr)[1])),
                'harmonics_percussive': self.separate_harmonics_percussive(y)
            }
            
        except Exception as e:
            print(f"Music analysis error: {e}")
            return {}
    
    def analyze_video_advanced(self, file):
        """Advanced video analysis with frame sampling and audio extraction"""
        try:
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp.close()
            video_path = tmp.name
            
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = total_frames / fps if fps > 0 else 0
            
            # Analyze key frames
            frame_analyses = []
            sample_rate = max(1, total_frames // 10)
            
            for frame_idx in range(0, total_frames, sample_rate):
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                success, frame = cap.read()
                
                if success:
                    frame_path = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg').name
                    cv2.imwrite(frame_path, frame)
                    
                    # Analyze frame
                    with open(frame_path, 'rb') as frame_file:
                        frame_analysis = self.analyze_image_advanced(frame_file)
                    
                    frame_analyses.append(frame_analysis)
                    os.unlink(frame_path)
            
            cap.release()
            
            # Extract and analyze audio if available
            audio_analysis = {}
            if PYDUB_AVAILABLE:
                try:
                    video = AudioSegment.from_file(video_path, "mp4")
                    audio_path = video_path + '.wav'
                    video.export(audio_path, format="wav")
                    audio_analysis = self.analyze_audio_advanced(open(audio_path, 'rb'))
                    os.unlink(audio_path)
                except Exception as e:
                    print(f"Video audio extraction error: {e}")
            
            # Aggregate results
            analysis = self.aggregate_video_analysis(frame_analyses, audio_analysis, total_frames, fps, duration)
            os.unlink(video_path)
            
            return analysis
            
        except Exception as e:
            print(f"Advanced video analysis error: {e}")
            return self.get_basic_analysis(file)
    
    def aggregate_video_analysis(self, frame_analyses, audio_analysis, total_frames, fps, duration):
        """Aggregate video analysis from multiple frames"""
        if not frame_analyses:
            return self.get_basic_analysis(None)
        
        base_analysis = frame_analyses[0]
        
        # Aggregate objects from all frames
        all_objects = []
        all_faces = []
        
        for analysis in frame_analyses:
            all_objects.extend(analysis.get('objects_detected', []))
            all_faces.extend(analysis.get('face_analysis', []))
        
        # Remove duplicates and keep highest confidence
        object_dict = {}
        for obj in all_objects:
            label = obj['label']
            if label not in object_dict or obj['confidence'] > object_dict[label]['confidence']:
                object_dict[label] = obj
        
        base_analysis['objects_detected'] = sorted(object_dict.values(), key=lambda x: x['confidence'], reverse=True)[:20]
        base_analysis['face_analysis'] = all_faces[:10]  # Keep first 10 faces
        
        # Add video-specific metadata
        base_analysis['video_metadata'] = {
            'total_frames': total_frames,
            'fps': round(fps, 2),
            'duration_seconds': round(duration, 2),
            'analyzed_frames': len(frame_analyses)
        }
        
        # Add audio analysis if available
        if audio_analysis:
            base_analysis['audio_analysis'] = audio_analysis
        
        # Update summary
        base_analysis['summary'] = f"Video analysis: {total_frames} frames, {fps:.1f} FPS, {duration:.1f}s duration. " + base_analysis.get('summary', '')
        
        return base_analysis
    
    # Helper methods for audio analysis
    def estimate_key(self, y, sr):
        """Estimate musical key"""
        try:
            chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
            key = np.argmax(np.sum(chroma, axis=1))
            keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            return keys[key % 12]
        except:
            return "Unknown"
    
    def analyze_chords(self, y, sr):
        """Basic chord analysis"""
        try:
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            return {"chroma_features": [float(x) for x in np.mean(chroma, axis=1)]}
        except:
            return {}
    
    def separate_harmonics_percussive(self, y):
        """Separate harmonic and percussive components"""
        try:
            y_harmonic, y_percussive = librosa.effects.hpss(y)
            return {
                "harmonic_strength": float(np.mean(y_harmonic)),
                "percussive_strength": float(np.mean(y_percussive))
            }
        except:
            return {}
    
    def calculate_audio_quality(self, features):
        """Calculate audio quality score"""
        try:
            score = 0.0
            if features.get('rms_energy', 0) > 0.01:
                score += 0.3
            if features.get('duration_seconds', 0) > 1.0:
                score += 0.3
            if features.get('spectral_centroid', 0) > 1000:
                score += 0.2
            if len(features.get('mfcc_features', [])) > 0:
                score += 0.2
            return min(score, 1.0)
        except:
            return 0.5
    
    def _transcribe_audio_basic(self, audio_path):
        """Basic speech recognition fallback"""
        try:
            r = sr.Recognizer()
            with sr.AudioFile(audio_path) as source:
                audio = r.record(source)
            return r.recognize_google(audio, language='fr-FR')
        except:
            return ""
    
    # Existing helper methods (keep these from your original code)
    def analyze_image_quality_advanced(self, img):
        """Enhanced image quality analysis"""
        # Your existing implementation
        return self.analyze_image_quality(img)
    
    def analyze_colors_advanced(self, img):
        """Enhanced color analysis"""
        # Your existing implementation  
        return self.analyze_colors(img)
    
    def detect_faces_opencv(self, img):
        """OpenCV face detection fallback"""
        # Your existing implementation
        return super().detect_faces_opencv(img)
    
    def get_technical_metadata(self, img):
        """Get technical metadata"""
        # Your existing implementation
        return super().get_technical_metadata(img)
    
    def get_used_models(self):
        """Get list of used AI models"""
        models = []
        if self.ai_models.get('yolo'):
            models.append('YOLOv8')
        if TENSORFLOW_AVAILABLE:
            models.append('EfficientNet')
        if DEEPFACE_AVAILABLE:
            models.append('DeepFace')
        if TRANSFORMERS_AVAILABLE:
            models.append('Transformers')
        if self.ai_models.get('whisper_model'):
            models.append('Whisper')
        if self.ai_models.get('audio_emotion'):
            models.append('Wav2Vec2')
        
        return models if models else ['OpenCV']
    
    def generate_comprehensive_summary(self, analysis):
        """Generate comprehensive analysis summary"""
        parts = []
        
        # Objects
        if analysis['objects_detected']:
            top_objects = [obj['label'] for obj in analysis['objects_detected'][:3]]
            parts.append(f"Objets: {', '.join(top_objects)}")
        
        # Faces
        if analysis['face_analysis']:
            face_count = len(analysis['face_analysis'])
            emotions = [face['emotion'] for face in analysis['face_analysis'][:2]]
            parts.append(f"{face_count} visage(s) - Émotions: {', '.join(emotions)}")
        
        # Scene
        if analysis['scene_analysis']:
            scene = analysis['scene_analysis']['primary_scene']
            confidence = analysis['scene_analysis']['confidence']
            if confidence > 0.7:
                parts.append(f"Scène: {scene}")
        
        # Quality
        quality = analysis['quality_metrics']
        if quality['overall_score'] > 0.8:
            parts.append("Haute qualité")
        elif quality['overall_score'] > 0.6:
            parts.append("Bonne qualité")
        
        return ". ".join(parts) if parts else "Analyse complète effectuée"
    
    def generate_advanced_tags(self, analysis):
        """Generate advanced tags from comprehensive analysis"""
        tags = set()
        
        # Object tags
        for obj in analysis['objects_detected'][:5]:
            tags.add(obj['label'].replace('_', ' '))
        
        # Face tags
        if analysis['face_analysis']:
            tags.add('person')
            tags.add('face')
            for face in analysis['face_analysis'][:2]:
                tags.add(face['emotion'])
                tags.add(face['gender'])
        
        # Scene tags
        if analysis['scene_analysis']:
            tags.add(analysis['scene_analysis']['primary_scene'].lower())
        
        # Quality tags
        quality = analysis['quality_metrics']
        if quality['overall_score'] > 0.8:
            tags.add('high quality')
        if quality['sharpness'] > 300:
            tags.add('sharp')
        
        # AI tags
        tags.add('ai analyzed')
        tags.add('computer vision')
        tags.add('deep learning')
        
        return list(tags)[:15]
    
    def determine_advanced_theme(self, analysis):
        """Determine advanced theme"""
        # Your existing implementation enhanced with new data
        return self.determine_theme(analysis)
    
    def generate_audio_summary(self, analysis):
        """Generate audio analysis summary"""
        parts = []
        
        basic = analysis['basic_features']
        speech = analysis['speech_analysis']
        emotion = analysis['emotion_analysis']
        
        parts.append(f"Durée: {basic['duration_seconds']}s")
        
        if basic['tempo_bpm'] > 0:
            parts.append(f"Tempo: {basic['tempo_bpm']} BPM")
        
        if speech.get('transcript'):
            parts.append(f"Transcription: {speech['transcript'][:100]}...")
        
        if emotion.get('emotion') != 'neutral':
            parts.append(f"Émotion: {emotion['emotion']}")
        
        return ". ".join(parts)
    
    def generate_audio_tags(self, analysis):
        """Generate audio-specific tags"""
        tags = set()
        
        basic = analysis['basic_features']
        speech = analysis['speech_analysis']
        emotion = analysis['emotion_analysis']
        
        tags.add('audio')
        
        if basic['duration_seconds'] > 60:
            tags.add('long')
        else:
            tags.add('short')
            
        if basic['tempo_bpm'] > 120:
            tags.add('fast')
        elif basic['tempo_bpm'] < 80:
            tags.add('slow')
            
        if speech.get('transcript'):
            tags.add('speech')
            tags.add('voice')
        else:
            tags.add('music')
            tags.add('instrumental')
            
        tags.add(emotion.get('emotion', 'neutral'))
        tags.add('ai analyzed')
        
        return list(tags)
    
    def determine_audio_theme(self, analysis):
        """Determine audio theme"""
        speech = analysis['speech_analysis']
        emotion = analysis['emotion_analysis']
        
        if speech.get('transcript'):
            return f"Speech - {emotion.get('emotion', 'Neutral')}"
        else:
            return f"Music - {emotion.get('emotion', 'Neutral')}"
    
    def get_basic_analysis(self, file):
        """Fallback basic analysis"""
        return {
            'media_type': 'unknown',
            'quality_score': 0.5,
            'theme': 'General',
            'tags': ['media'],
            'summary': 'Basic analysis completed',
            'ai_models_used': ['Basic'],
            'analysis_timestamp': datetime.now().isoformat()
        }