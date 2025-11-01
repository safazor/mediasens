# editing_app/services/style_transfer.py
import cv2
import numpy as np
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)

class StyleTransferService:
    def __init__(self):
        self.styles = {
            'van_gogh': self._apply_van_gogh_style,
            'sketch': self._apply_sketch_style,
            'warm': self._apply_warm_filter,
            'vintage': self._apply_vintage_style,
            'cool': self._apply_cool_filter,
            'pop_art': self._apply_pop_art_style,
            'noir': self._apply_noir_style,
            'pixel_art': self._apply_pixel_art_style,
            'mirror': self._apply_mirror_effect,
            'blur_dream': self._apply_blur_dream_style,
            'solarize': self._apply_solarize_effect,
        }
    
    # ✅ ACTION 1: APPLIQUER SEULEMENT LES PARAMÈTRES
    def apply_adjustments(self, image_file, parameters):
        try:
            logger.info(f"Applying adjustments: {parameters}")
            
            # Lire l'image
            image_bytes = image_file.read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Impossible de décoder l'image")
            
            # Appliquer SEULEMENT les réglages Photoshop
            result_image = self._apply_photoshop_adjustments(image, parameters)
            
            result_file = self._numpy_to_django_file(result_image)
            return result_file
            
        except Exception as e:
            logger.error(f"Error in apply_adjustments: {str(e)}")
            raise
    
    # ✅ ACTION 2: APPLIQUER SEULEMENT LE STYLE
    def apply_style(self, image_file, style_name):
        try:
            logger.info(f"Applying style: {style_name}")
            
            # Lire l'image
            image_bytes = image_file.read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Impossible de décoder l'image")
            
            # Appliquer SEULEMENT le style (sans paramètres)
            if style_name in self.styles:
                result_image = self.styles[style_name](image)
            else:
                result_image = image
            
            result_file = self._numpy_to_django_file(result_image)
            return result_file
            
        except Exception as e:
            logger.error(f"Error in apply_style: {str(e)}")
            raise
    
    # ✅ ACTION 3: APPLIQUER PARAMÈTRES + STYLE (optionnel)
    def apply_adjustments_and_style(self, image_file, style_name, parameters):
        try:
            logger.info(f"Applying adjustments + style: {parameters} + {style_name}")
            
            # Lire l'image
            image_bytes = image_file.read()
            nparr = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Impossible de décoder l'image")
            
            # 1. Appliquer les réglages
            adjusted_image = self._apply_photoshop_adjustments(image, parameters)
            
            # 2. Appliquer le style
            if style_name in self.styles:
                result_image = self.styles[style_name](adjusted_image)
            else:
                result_image = adjusted_image
            
            result_file = self._numpy_to_django_file(result_image)
            return result_file
            
        except Exception as e:
            logger.error(f"Error in apply_adjustments_and_style: {str(e)}")
            raise
    
    def _apply_photoshop_adjustments(self, image, parameters):
        result = image.copy().astype(np.float32)
        
        # LUMINOSITÉ (-100 à +100)
        if parameters.get('brightness'):
            brightness = parameters['brightness']
            result += brightness * 2.55
        
        # CONTRASTE (-100 à +100)
        if parameters.get('contrast'):
            contrast = parameters['contrast'] / 100.0
            result = (result - 127.5) * (1 + contrast) + 127.5
        
        # SATURATION (-100 à +100)
        if parameters.get('saturation'):
            saturation = 1 + parameters['saturation'] / 100.0
            hsv = cv2.cvtColor(np.clip(result, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
            hsv = hsv.astype(np.float32)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation, 0, 255)
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
        
        # TEINTE (-180 à +180)
        if parameters.get('hue'):
            hue = parameters['hue']
            hsv = cv2.cvtColor(np.clip(result, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
            hsv = hsv.astype(np.float32)
            hsv[:, :, 0] = (hsv[:, :, 0] + hue) % 180
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
        
        # NETTETÉ (0 à 100)
        if parameters.get('sharpness'):
            sharpness = parameters['sharpness'] / 20.0
            kernel = np.array([[-1,-1,-1], [-1, 9+sharpness,-1], [-1,-1,-1]])
            result = cv2.filter2D(np.clip(result, 0, 255).astype(np.uint8), -1, kernel).astype(np.float32)
        
        # FLOU (0 à 100)
        if parameters.get('blur'):
            blur = parameters['blur']
            if blur > 0:
                kernel_size = max(1, int(blur/20) * 2 + 1)
                result = cv2.GaussianBlur(np.clip(result, 0, 255).astype(np.uint8), (kernel_size, kernel_size), 0).astype(np.float32)
        
        # EXPOSITION (-100 à +100)
        if parameters.get('exposure'):
            exposure = parameters['exposure'] / 100.0
            result = result * (1 + exposure)
        
        # TEMPÉRATURE (-100 à +100)
        if parameters.get('temperature'):
            temp = parameters['temperature']
            if temp > 0:  # Chaud
                result[:, :, 2] = np.clip(result[:, :, 2] + temp*1.5, 0, 255)
                result[:, :, 1] = np.clip(result[:, :, 1] + temp*0.5, 0, 255)
            else:  # Froid
                result[:, :, 0] = np.clip(result[:, :, 0] - temp*1.5, 0, 255)
                result[:, :, 1] = np.clip(result[:, :, 1] - temp*0.3, 0, 255)
        
        # GAMMA (0.1 à 3.0)
        if parameters.get('gamma'):
            gamma = parameters['gamma']
            result = 255 * (result / 255) ** (1.0 / gamma)
        
        # VIBRANCE (-100 à +100)
        if parameters.get('vibrance'):
            vibrance = parameters['vibrance'] / 100.0
            hsv = cv2.cvtColor(np.clip(result, 0, 255).astype(np.uint8), cv2.COLOR_BGR2HSV)
            hsv = hsv.astype(np.float32)
            saturation_mask = hsv[:, :, 1] < 128
            hsv[saturation_mask, 1] = np.clip(hsv[saturation_mask, 1] * (1 + vibrance), 0, 255)
            result = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR).astype(np.float32)
        
        return np.clip(result, 0, 255).astype(np.uint8)

    # ✅ STYLES SANS PARAMÈTRES (version simplifiée)
    def _apply_van_gogh_style(self, image):
        kernel = np.array([[-1, -1, -1],
                          [-1,  9, -1],
                          [-1, -1, -1]])
        return cv2.filter2D(image, -1, kernel)
    
    def _apply_sketch_style(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        inverted = 255 - gray
        blurred = cv2.GaussianBlur(inverted, (21, 21), 0)
        inverted_blurred = 255 - blurred
        sketch = cv2.divide(gray, inverted_blurred, scale=256.0)
        return cv2.cvtColor(sketch, cv2.COLOR_GRAY2BGR)
    
    def _apply_warm_filter(self, image):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv[:, :, 0] = np.clip(hsv[:, :, 0] * 0.9, 0, 179)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.2, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1, 0, 255)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    def _apply_vintage_style(self, image):
        kernel = np.array([[0.272, 0.534, 0.131],
                          [0.349, 0.686, 0.168],
                          [0.393, 0.769, 0.189]])
        sepia = cv2.transform(image, kernel)
        noise = np.random.normal(0, 10, sepia.shape).astype(np.uint8)
        sepia = cv2.add(sepia, noise)
        sepia = cv2.convertScaleAbs(sepia, alpha=0.9, beta=10)
        return np.clip(sepia, 0, 255)
    
    def _apply_cool_filter(self, image):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        hsv[:, :, 0] = np.clip(hsv[:, :, 0] * 1.2, 0, 179)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 0.9, 0, 255)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 0.95, 0, 255)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    def _apply_pop_art_style(self, image):
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        lab[:, :, 0] = cv2.createCLAHE(clipLimit=3.0).apply(lab[:, :, 0])
        high_contrast = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        hsv = cv2.cvtColor(high_contrast, cv2.COLOR_BGR2HSV)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.5, 0, 255)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    def _apply_noir_style(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        _, dramatic = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)
        return cv2.cvtColor(dramatic, cv2.COLOR_GRAY2BGR)
    
    def _apply_pixel_art_style(self, image):
        small = cv2.resize(image, (64, 64), interpolation=cv2.INTER_NEAREST)
        pixel_art = cv2.resize(small, (image.shape[1], image.shape[0]), interpolation=cv2.INTER_NEAREST)
        return pixel_art
    
    def _apply_mirror_effect(self, image):
        height, width = image.shape[:2]
        left_half = image[:, :width//2]
        right_half = cv2.flip(left_half, 1)
        mirrored = np.hstack((left_half, right_half))
        return mirrored
    
    def _apply_blur_dream_style(self, image):
        blurred = cv2.GaussianBlur(image, (15, 15), 0)
        dreamy = cv2.addWeighted(image, 0.7, blurred, 0.3, 0)
        hsv = cv2.cvtColor(dreamy, cv2.COLOR_BGR2HSV)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1, 0, 255)
        return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    def _apply_solarize_effect(self, image):
        threshold = 128
        solarized = image.copy()
        mask = image > threshold
        solarized[mask] = 255 - solarized[mask]
        return solarized
    
    def _numpy_to_django_file(self, image):
        success, encoded_image = cv2.imencode('.jpg', image, [cv2.IMWRITE_JPEG_QUALITY, 95])
        buffer = encoded_image.tobytes()
        return ContentFile(buffer, 'styled_image.jpg')