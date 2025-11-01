# editing_app/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import EditingProject, StyleTransferResult, VideoProject, VideoEffectResult, VideoScene
from .serializers import (
    EditingProjectSerializer, 
    StyleTransferResultSerializer,
    VideoProjectSerializer,
    VideoEffectResultSerializer,
    VideoSceneSerializer
)
from .services.style_transfer import StyleTransferService
from .services.video_processor import VideoProcessor
import logging

logger = logging.getLogger(__name__)

class EditingProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des projets d'édition d'images
    """
    queryset = EditingProject.objects.all()
    serializer_class = EditingProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    # ✅ ACTION 1: APPLIQUER SEULEMENT LES PARAMÈTRES
    @action(detail=True, methods=['post'])
    def apply_adjustments(self, request, pk=None):
        """
        Applique uniquement les paramètres d'ajustement à l'image
        """
        project = self.get_object()
        parameters = request.data.get('parameters', {})
        
        try:
            with project.original_image.open('rb') as image_file:
                style_service = StyleTransferService()
                result_file = style_service.apply_adjustments(image_file, parameters)
            
            result = StyleTransferResult.objects.create(
                project=project,
                style_name='adjustments_only',
                result_image=result_file
            )
            
            serializer = StyleTransferResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error applying adjustments: {str(e)}")
            return Response(
                {'error': f'Erreur lors des réglages: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ✅ ACTION 2: APPLIQUER SEULEMENT LE STYLE (SANS PARAMÈTRES)
    @action(detail=True, methods=['post'])
    def apply_style_only(self, request, pk=None):
        """
        Applique uniquement le transfert de style à l'image
        """
        project = self.get_object()
        style_name = request.data.get('style_name', 'van_gogh')
        
        try:
            with project.original_image.open('rb') as image_file:
                style_service = StyleTransferService()
                result_file = style_service.apply_style(image_file, style_name)
            
            result = StyleTransferResult.objects.create(
                project=project,
                style_name=style_name,
                result_image=result_file
            )
            
            serializer = StyleTransferResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error applying style: {str(e)}")
            return Response(
                {'error': f'Erreur lors de l\'application du style: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # ✅ ACTION 3: APPLIQUER PARAMÈTRES + STYLE
    @action(detail=True, methods=['post'])
    def apply_adjustments_and_style(self, request, pk=None):
        """
        Applique les paramètres d'ajustement puis le transfert de style
        """
        project = self.get_object()
        style_name = request.data.get('style_name', 'van_gogh')
        parameters = request.data.get('parameters', {})
        
        try:
            with project.original_image.open('rb') as image_file:
                style_service = StyleTransferService()
                result_file = style_service.apply_adjustments_and_style(image_file, style_name, parameters)
            
            result = StyleTransferResult.objects.create(
                project=project,
                style_name=f"{style_name}_with_adjustments",
                result_image=result_file
            )
            
            serializer = StyleTransferResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error applying adjustments and style: {str(e)}")
            return Response(
                {'error': f'Erreur lors de l\'application: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VideoProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des projets vidéo
    """
    queryset = VideoProject.objects.all()
    serializer_class = VideoProjectSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return self.queryset.filter(created_by=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def apply_video_effect(self, request, pk=None):
        """
        Applique un effet vidéo au projet
        """
        project = self.get_object()
        effect_name = request.data.get('effect_name', 'cinematic')
        
        try:
            with project.original_video.open('rb') as video_file:
                video_processor = VideoProcessor()
                result_file = video_processor.apply_video_effect(video_file, effect_name)
            
            result = VideoEffectResult.objects.create(
                project=project,
                effect_name=effect_name,
                processed_video=result_file
            )
            
            serializer = VideoEffectResultSerializer(result)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error applying video effect: {str(e)}")
            return Response(
                {'error': f'Erreur lors de l\'application de l\'effet: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🔧 REMPLACÉ : Détection de scènes → Détection de visages
    @action(detail=True, methods=['post'])
    def detect_faces(self, request, pk=None):
        """
        Détecte et analyse les visages dans la vidéo
        """
        project = self.get_object()
        
        try:
            with project.original_video.open('rb') as video_file:
                video_processor = VideoProcessor()
                face_analysis = video_processor.detect_faces(video_file)
            
            # 🔧 AMÉLIORATION : Utiliser most_common_face_count pour plus de précision
            analysis = face_analysis['analysis']
            most_common_count = analysis.get('most_common_face_count', analysis['max_faces_simultaneous'])
            stability = analysis.get('detection_stability', 1.0)
            
            # Message adapté selon la stabilité
            if stability > 0.7:
                message = f"✅ Analyse terminée - {most_common_count} personne(s) détectée(s) (détection stable)"
            elif stability > 0.4:
                message = f"⚠️ Analyse terminée - {most_common_count} personne(s) détectée(s) (détection modérée)"
            else:
                message = f"📊 Analyse terminée - {most_common_count} personne(s) détectée(s) (détection variable)"
            
            return Response({
                'face_analysis': face_analysis,
                'message': message,
                'summary': {
                    'most_common_faces': most_common_count,
                    'max_faces': analysis['max_faces_simultaneous'],
                    'stability_score': stability,
                    'presence_percentage': analysis['face_presence_percentage']
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la détection des visages: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def generate_subtitles(self, request, pk=None):
        """
        Génère des sous-titres automatiques pour la vidéo - Support FR/EN
        """
        project = self.get_object()
        language = request.data.get('language', 'fr')
        
        try:
            with project.original_video.open('rb') as video_file:
                video_processor = VideoProcessor()
                result = video_processor.generate_subtitles(video_file, language)
            
            return Response({
                'subtitles': result['subtitles'],
                'language_detected': result['language_detected'],
                'language_requested': result['language_requested'],
                'total_segments': len(result['subtitles']),
                'message': f"Sous-titres générés ({result['language_detected']})"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating subtitles: {str(e)}")
            return Response(
                {'error': f'Erreur lors de la génération des sous-titres: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # 🔧 SUPPRIMER ou GARDER (au cas où tu veux garder l'ancienne fonctionnalité)
    @action(detail=True, methods=['get'])
    def scenes(self, request, pk=None):
        """
        Récupère les scènes détectées pour le projet vidéo
        """
        project = self.get_object()
        scenes = VideoScene.objects.filter(project=project)
        serializer = VideoSceneSerializer(scenes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # 🔧 AJOUT : Méthode pour lister les langues supportées
    @action(detail=False, methods=['get'])
    def supported_languages(self, request):
        """
        Retourne la liste des langues supportées pour les sous-titres
        """
        supported_languages = [
            {'code': 'fr', 'name': 'Français'},
            {'code': 'en', 'name': 'English'},
            {'code': 'es', 'name': 'Español'},
            {'code': 'de', 'name': 'Deutsch'},
            {'code': 'it', 'name': 'Italiano'},
            {'code': 'auto', 'name': 'Détection automatique'}
        ]
        
        return Response({
            'languages': supported_languages,
            'default_language': 'fr'
        }, status=status.HTTP_200_OK)