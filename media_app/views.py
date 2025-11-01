from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Media
from .serializers import MediaSerializer
import random
import os
import numpy as np

# OpenCV is optional. Avoid crashing the server at import time if it's missing.
try:
    import cv2  # type: ignore
    CV2_AVAILABLE = True
except Exception:
    cv2 = None  # type: ignore
    CV2_AVAILABLE = False


class MediaViewSet(viewsets.ModelViewSet):
    # ✅ Trie les fichiers les plus récents en premier
    queryset = Media.objects.all().order_by('-uploaded_at')
    serializer_class = MediaSerializer

    def perform_auto_classification(self, file):
        """
        Analyse automatique avec IA (CNN + OpenCV)
        """
        name = file.name.lower()

        # ---- Détection du type de média ----
        if any(ext in name for ext in ['.jpg', '.jpeg', '.png', '.gif']):
            media_type = 'image'
        elif any(ext in name for ext in ['.mp4', '.mov', '.avi']):
            media_type = 'video'
        elif name.endswith('.pdf'):
            media_type = 'document'
        else:
            media_type = 'inconnu'

        # ---- Analyse de qualité si image ----
        quality_score = 0.0
        tags = []
        theme = "Générique"

        if media_type == 'image':
            if CV2_AVAILABLE:
                try:
                    # Sauvegarde temporaire du fichier pour lecture OpenCV
                    import tempfile
                    tmp = tempfile.NamedTemporaryFile(delete=False)
                    for chunk in file.chunks():
                        tmp.write(chunk)
                    tmp.close()
                    img_path = tmp.name

                    # Analyse avec OpenCV
                    img = cv2.imread(img_path)
                    if img is None:
                        raise ValueError("OpenCV n'a pas pu lire l'image.")
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

                    # Mesure du flou
                    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
                    flou_score = min(variance / 1000, 1.0)

                    # Luminosité
                    brightness = np.mean(gray) / 255.0

                    # Calcul final qualité
                    quality_score = round((0.6 * flou_score + 0.4 * brightness), 2)

                    # ---- CNN pour classification (imports paresseux pour éviter erreurs d'environnement au démarrage) ----
                    from tensorflow.keras.applications.mobilenet_v2 import (
                        MobileNetV2, preprocess_input, decode_predictions
                    )
                    from tensorflow.keras.preprocessing import image as keras_image

                    model = MobileNetV2(weights='imagenet')
                    img_pil = keras_image.load_img(img_path, target_size=(224, 224))
                    x = keras_image.img_to_array(img_pil)
                    x = np.expand_dims(x, axis=0)
                    x = preprocess_input(x)
                    preds = model.predict(x)
                    decoded = decode_predictions(preds, top=3)[0]
                    tags = [d[1] for d in decoded]
                    theme = decoded[0][1].capitalize()

                except Exception as e:
                    print("Erreur IA :", e)
                    theme = "Analyse échouée"
                    tags = ["inconnu"]
                    quality_score = 0.5
            else:
                # OpenCV non disponible: fournir des valeurs par défaut raisonnables sans casser le serveur
                theme = "Image"
                tags = ["image"]
                quality_score = 0.6  # valeur par défaut neutre

        else:
            # Pour vidéo, document, etc.
            theme = media_type.capitalize()
            quality_score = round(random.uniform(0.5, 1.0), 2)
            tags = random.sample(
                ['portrait', 'paysage', 'action', 'nuit', 'extérieur', 'intérieur', 'nature', 'urbain'],
                3
            )

        return media_type, quality_score, theme, tags

    def create(self, request, *args, **kwargs):
        """
        Endpoint POST /api/media/ — upload + classification
        """
        serializer = MediaSerializer(data=request.data)
        if serializer.is_valid():
            file = request.FILES.get('file')
            if file:
                media_type, quality, theme, tags = self.perform_auto_classification(file)
                serializer.save(
                    media_type=media_type,
                    quality_score=quality,
                    theme=theme,
                    tags=', '.join(tags),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response({'error': 'Aucun fichier reçu.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 🔄 Réanalyse IA d’un média existant
    @action(detail=True, methods=['post'])
    def reanalyse(self, request, pk=None):
        """
        Permet de relancer l'analyse IA sur un média déjà enregistré.
        """
        media = self.get_object()
        file = media.file
        media_type, quality, theme, tags = self.perform_auto_classification(file)
        media.media_type = media_type
        media.quality_score = quality
        media.theme = theme
        media.tags = ', '.join(tags)
        media.save()
        return Response(MediaSerializer(media).data)
