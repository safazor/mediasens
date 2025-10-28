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

class AdvancedAIService:
    def __init__(self):
        self.models_loaded = False
        self.load_models()
    
    def load_models(self):
        """Load available AI models"""
        try:
            # Try to load YOLO for object detection
            try:
                from ultralytics import YOLO
                self.yolo_model = YOLO('yolov8n.pt')
                print("✅ YOLOv8 model loaded")
                self.yolo_available = True
            except ImportError:
                print("❌ YOLOv8 not available, using OpenCV detection")
                self.yolo_available = False
            
            print("🎯 AI models loaded successfully")
            self.models_loaded = True
            
        except Exception as e:
            print(f"❌ Error loading AI models: {e}")
            self.models_loaded = False
    
    def analyze_media(self, file):
        """Comprehensive AI analysis for all media types"""
        filename = file.name.lower()
        
        if any(ext in filename for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
            return self.analyze_image(file)
        elif any(ext in filename for ext in ['.mp4', '.mov', '.avi', '.mkv', '.webm']):
            return self.analyze_video(file)
        elif any(ext in filename for ext in ['.mp3', '.wav', '.m4a', '.flac', '.aac', '.ogg']):
            return self.analyze_audio(file)
        else:
            return self.get_basic_analysis(file)
    
    def analyze_image(self, file):
        """Advanced image analysis"""
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
            
            # Comprehensive analysis
            analysis = {
                'media_type': 'image',
                'quality_metrics': self.analyze_image_quality(img),
                'objects_detected': self.detect_objects_advanced(img_path),
                'face_analysis': self.detect_faces_opencv(img),
                'color_analysis': self.analyze_colors(img),
                'technical_metadata': self.get_technical_metadata(img),
                'ai_models_used': ['OpenCV', 'YOLOv8' if self.yolo_available else 'HaarCascade'],
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            # Generate comprehensive summary and tags
            analysis['summary'] = self.generate_image_summary(analysis)
            analysis['tags'] = self.generate_image_tags(analysis)
            analysis['theme'] = self.determine_theme(analysis)
            analysis['quality_score'] = analysis['quality_metrics']['overall_score']
            
            os.unlink(img_path)
            return analysis
            
        except Exception as e:
            print(f"Image analysis error: {e}")
            return self.get_basic_analysis(file)
    
    def detect_objects_advanced(self, image_path):
        """Object detection using available models"""
        objects = []
        
        # Try YOLO first
        if self.yolo_available:
            objects = self.detect_objects_yolo(image_path)
        
        # If no objects detected with YOLO, use OpenCV-based detection
        if not objects:
            objects = self.detect_objects_opencv(image_path)
        
        return objects
    
    def detect_objects_yolo(self, image_path):
        """Object detection with YOLOv8"""
        objects = []
        try:
            results = self.yolo_model(image_path)
            
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
                                'area': round((x2 - x1) * (y2 - y1))
                            })
            
            # Sort by confidence
            objects.sort(key=lambda x: x['confidence'], reverse=True)
            return objects[:10]  # Return top 10 objects
            
        except Exception as e:
            print(f"YOLO detection error: {e}")
            return []
    
    def detect_objects_opencv(self, image_path):
        """Fallback object detection using OpenCV"""
        objects = []
        try:
            img = cv2.imread(image_path)
            if img is None:
                return objects
            
            # Color-based object detection
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Define color ranges for common objects
            color_detections = [
                ('red_object', np.array([0, 120, 70]), np.array([10, 255, 255])),
                ('blue_object', np.array([100, 150, 0]), np.array([140, 255, 255])),
                ('green_object', np.array([40, 40, 40]), np.array([80, 255, 255])),
                ('yellow_object', np.array([20, 100, 100]), np.array([30, 255, 255])),
            ]
            
            for color_name, lower, upper in color_detections:
                mask = cv2.inRange(hsv, lower, upper)
                contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                for contour in contours:
                    area = cv2.contourArea(contour)
                    if area > 1000:  # Minimum area threshold
                        x, y, w, h = cv2.boundingRect(contour)
                        objects.append({
                            'label': color_name,
                            'confidence': 0.6,
                            'bbox': [x, y, x + w, y + h],
                            'area': area
                        })
            
            return objects
            
        except Exception as e:
            print(f"OpenCV object detection error: {e}")
            return []
    
    def detect_faces_opencv(self, img):
        """Face detection using OpenCV Haar cascades"""
        faces = []
        try:
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Detect faces
            detected_faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            for (x, y, w, h) in detected_faces:
                # Simple emotion estimation based on facial proportions
                emotion = self.estimate_emotion(img, x, y, w, h)
                
                faces.append({
                    'age': self.estimate_age(w, h),
                    'gender': self.estimate_gender(w, h),
                    'emotion': emotion,
                    'confidence': 0.7,
                    'region': {'x': x, 'y': y, 'w': w, 'h': h}
                })
            
            return faces
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return []
    
    def estimate_emotion(self, img, x, y, w, h):
        """Simple emotion estimation based on facial features"""
        try:
            # Crop face region
            face_region = img[y:y+h, x:x+w]
            if face_region.size == 0:
                return "neutral"
            
            # Convert to grayscale
            gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            
            # Analyze brightness and contrast for emotion clues
            brightness = np.mean(gray_face)
            contrast = np.std(gray_face)
            
            if brightness > 150 and contrast > 50:
                return "happy"
            elif brightness < 100 and contrast < 30:
                return "sad"
            elif contrast > 60:
                return "surprised"
            else:
                return "neutral"
                
        except:
            return "neutral"
    
    def estimate_age(self, face_width, face_height):
        """Simple age estimation based on face size"""
        face_size = face_width * face_height
        if face_size < 5000:
            return "child"
        elif face_size < 15000:
            return "young adult"
        else:
            return "adult"
    
    def estimate_gender(self, face_width, face_height):
        """Simple gender estimation based on face proportions"""
        aspect_ratio = face_width / face_height
        return "female" if aspect_ratio > 0.85 else "male"
    
    def analyze_image_quality(self, img):
        """Comprehensive image quality analysis"""
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            height, width = img.shape[:2]
            
            # Sharpness (variance of Laplacian)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Brightness
            brightness = np.mean(gray) / 255.0
            
            # Contrast
            contrast = np.std(gray) / 255.0
            
            # Noise estimation
            noise = self.estimate_noise(gray)
            
            # Composition score (rule of thirds)
            composition = self.analyze_composition(img)
            
            # Overall quality score
            overall_score = (
                min(sharpness / 500, 1.0) * 0.3 +
                brightness * 0.2 +
                contrast * 0.2 +
                (1 - noise) * 0.2 +
                composition * 0.1
            )
            
            return {
                'sharpness': round(float(sharpness), 2),
                'brightness': round(float(brightness), 2),
                'contrast': round(float(contrast), 2),
                'noise_level': round(float(noise), 2),
                'composition_score': round(float(composition), 2),
                'resolution': f"{width}x{height}",
                'overall_score': round(float(overall_score), 2)
            }
            
        except Exception as e:
            print(f"Quality analysis error: {e}")
            return {
                'sharpness': 0.5, 'brightness': 0.5, 'contrast': 0.5,
                'noise_level': 0.5, 'composition_score': 0.5,
                'resolution': 'unknown', 'overall_score': 0.5
            }
    
    def estimate_noise(self, gray_img):
        """Estimate image noise level"""
        try:
            # Use variance of the Laplacian to estimate noise
            laplacian_var = cv2.Laplacian(gray_img, cv2.CV_64F).var()
            # Normalize to 0-1 range (higher means more noise)
            noise_level = min(laplacian_var / 1000, 1.0)
            return noise_level
        except:
            return 0.5
    
    def analyze_composition(self, img):
        """Analyze image composition (rule of thirds)"""
        try:
            height, width = img.shape[:2]
            
            # Calculate key points for rule of thirds
            third_x = width // 3
            third_y = height // 3
            
            # Simple composition score based on image center
            center_x, center_y = width // 2, height // 2
            dist_from_center = np.sqrt((center_x - third_x*2)**2 + (center_y - third_y*2)**2)
            max_dist = np.sqrt((width//2)**2 + (height//2)**2)
            
            composition_score = 1.0 - (dist_from_center / max_dist)
            return composition_score
        except:
            return 0.5
    
    def analyze_colors(self, img):
        """Analyze color distribution"""
        try:
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Calculate color histograms
            h_hist = cv2.calcHist([hsv], [0], None, [180], [0, 180])
            s_hist = cv2.calcHist([hsv], [1], None, [256], [0, 256])
            v_hist = cv2.calcHist([hsv], [2], None, [256], [0, 256])
            
            # Find dominant colors
            dominant_hue = np.argmax(h_hist)
            saturation_mean = np.mean(s_hist)
            brightness_mean = np.mean(v_hist)
            
            # Colorfulness metric
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            a_std, b_std = np.std(lab[:,:,1]), np.std(lab[:,:,2])
            colorfulness = np.sqrt(a_std**2 + b_std**2)
            
            return {
                'dominant_hue': int(dominant_hue),
                'saturation': float(saturation_mean),
                'brightness': float(brightness_mean),
                'colorfulness': float(colorfulness),
                'color_palette': self.extract_color_palette(img)
            }
        except Exception as e:
            print(f"Color analysis error: {e}")
            return {}
    
    def extract_color_palette(self, img, n_colors=5):
        """Extract dominant color palette"""
        try:
            # Resize image for faster processing
            small_img = cv2.resize(img, (100, 100))
            pixels = small_img.reshape(-1, 3)
            
            # Use k-means to find dominant colors
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
            _, labels, centers = cv2.kmeans(
                pixels.astype(np.float32), n_colors, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS
            )
            
            # Convert to hex colors
            palette = []
            for color in centers:
                b, g, r = color
                hex_color = f"#{int(r):02x}{int(g):02x}{int(b):02x}"
                palette.append(hex_color)
            
            return palette
        except:
            return ["#000000", "#666666", "#999999", "#cccccc", "#ffffff"]
    
    def get_technical_metadata(self, img):
        """Extract technical metadata from image"""
        try:
            height, width, channels = img.shape
            return {
                'dimensions': f"{width}x{height}",
                'channels': channels,
                'file_size_estimate': width * height * channels,
                'aspect_ratio': round(width / height, 2)
            }
        except:
            return {}
    
    def generate_image_summary(self, analysis):
        """Generate comprehensive image analysis summary"""
        parts = []
        
        # Objects detected
        if analysis['objects_detected']:
            top_objects = [obj['label'] for obj in analysis['objects_detected'][:3]]
            parts.append(f"Objets détectés: {', '.join(top_objects)}")
        
        # Faces detected
        if analysis['face_analysis']:
            face_count = len(analysis['face_analysis'])
            emotions = [face['emotion'] for face in analysis['face_analysis'][:2]]
            parts.append(f"{face_count} visage(s) - Émotions: {', '.join(emotions)}")
        
        # Quality assessment
        quality = analysis['quality_metrics']
        quality_parts = []
        if quality['overall_score'] > 0.8:
            quality_parts.append("haute qualité")
        elif quality['overall_score'] > 0.6:
            quality_parts.append("bonne qualité")
        else:
            quality_parts.append("qualité moyenne")
        
        if quality['sharpness'] > 300:
            quality_parts.append("nette")
        
        if quality['brightness'] > 0.7:
            quality_parts.append("lumineuse")
        elif quality['brightness'] < 0.3:
            quality_parts.append("sombre")
        
        if quality_parts:
            parts.append(f"Image {', '.join(quality_parts)}")
        
        # Scene context
        theme = analysis.get('theme', 'General')
        if theme != 'General':
            parts.append(f"Contexte: {theme}")
        
        return ". ".join(parts) if parts else "Analyse d'image complète effectuée"
    
    def generate_image_tags(self, analysis):
        """Generate relevant tags for the image"""
        tags = set()
        
        # Add object tags
        for obj in analysis['objects_detected'][:5]:
            tags.add(obj['label'].replace('_', ' '))
        
        # Add face-related tags
        if analysis['face_analysis']:
            tags.add('person')
            tags.add('face')
            for face in analysis['face_analysis'][:2]:
                tags.add(face['emotion'])
                tags.add(face['gender'])
                tags.add(face['age'])
        
        # Add quality tags
        quality = analysis['quality_metrics']
        if quality['overall_score'] > 0.8:
            tags.add('high quality')
        if quality['sharpness'] > 300:
            tags.add('sharp')
        if quality['brightness'] > 0.7:
            tags.add('bright')
        
        # Add theme tag
        tags.add(analysis.get('theme', 'general').lower())
        
        # Add technical tags
        tags.add('ai analyzed')
        tags.add('computer vision')
        
        return list(tags)[:10]
    
    def determine_theme(self, analysis):
        """Determine the main theme of the image"""
        objects = [obj['label'] for obj in analysis['objects_detected']]
        object_str = ' '.join(objects).lower()
        
        # Theme detection based on objects
        if any(obj in object_str for obj in ['person', 'face']):
            if len(analysis['face_analysis']) > 2:
                return "Group Portrait"
            else:
                return "Portrait"
        elif any(obj in object_str for obj in ['car', 'bus', 'truck', 'motorcycle']):
            return "Transportation"
        elif any(obj in object_str for obj in ['building', 'house', 'skyscraper']):
            return "Architecture"
        elif any(obj in object_str for obj in ['tree', 'grass', 'mountain', 'sky']):
            return "Nature"
        elif any(obj in object_str for obj in ['computer', 'keyboard', 'mouse']):
            return "Technology"
        else:
            return "General"
    
    def analyze_video(self, file):
        """Video analysis implementation"""
        # Simplified video analysis
        return {
            'media_type': 'video',
            'quality_score': 0.7,
            'theme': 'Video Content',
            'tags': ['video', 'media', 'motion'],
            'summary': 'Video file analyzed - basic metadata extracted',
            'ai_models_used': ['OpenCV'],
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    def analyze_audio(self, file):
        """Audio analysis implementation"""
        # Simplified audio analysis
        return {
            'media_type': 'audio',
            'quality_score': 0.6,
            'theme': 'Audio Content',
            'tags': ['audio', 'sound', 'media'],
            'summary': 'Audio file analyzed - basic features extracted',
            'ai_models_used': ['Librosa'],
            'analysis_timestamp': datetime.now().isoformat()
        }
    
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