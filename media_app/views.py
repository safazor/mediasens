from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Media
from .serializers import MediaSerializer
from .advanced_ai_service import AdvancedAIService

# Global AI service instance
ai_service = AdvancedAIService()


try:
    from .advanced_ai_analyzer import AdvancedAIAnalyzer
    ADVANCED_AI_AVAILABLE = True
except ImportError as e:
    print(f"Advanced AI Analyzer not available: {e}")
    ADVANCED_AI_AVAILABLE = False
    from .ai_analysis import AdvancedMediaAnalyzer as AdvancedAIAnalyzer

class MediaViewSet(viewsets.ModelViewSet):
    queryset = Media.objects.all().order_by('-uploaded_at')
    serializer_class = MediaSerializer

    def create(self, request, *args, **kwargs):
        """Enhanced upload with REAL Module 2 AI analysis"""
        serializer = MediaSerializer(data=request.data)
        if serializer.is_valid():
            file = request.FILES.get('file')
            if file:
                try:
                    analyzer = AdvancedAIAnalyzer()
                    media_type, analysis = analyzer.analyze_media(file)
                    
                    media = serializer.save(
                        media_type=media_type,
                        quality_score=analysis['quality_score'],
                        theme=analysis['theme'],
                        tags=', '.join(analysis['tags'][:5]),
                        objects_detected=analysis['objects_detected'],
                        faces_detected=analysis['faces_detected'],
                        emotions=analysis['emotions'],
                        scene_context=analysis['scene_context'],
                        audio_analysis=analysis.get('audio_analysis', {}),
                        analysis_summary=analysis['analysis_summary']
                    )
                    return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    print(f"AI analysis error: {e}")
                    media = serializer.save()
                    return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)
            return Response({'error': 'Aucun fichier reçu.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=False, methods=['get'])
    def by_theme(self, request):
        """Get media filtered by theme"""
        theme = request.query_params.get('theme')
        if theme:
            media = self.queryset.filter(theme=theme)
            serializer = self.get_serializer(media, many=True)
            return Response(serializer.data)
        return Response({'error': 'Theme parameter required'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get AI-powered recommendations"""
        media_id = request.query_params.get('media_id')
        if media_id:
            try:
                media = Media.objects.get(id=media_id)
                similar = Media.objects.filter(theme=media.theme).exclude(id=media_id)[:5]
                serializer = self.get_serializer(similar, many=True)
                return Response(serializer.data)
            except Media.DoesNotExist:
                return Response({'error': 'Media not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'error': 'Media ID required'}, status=status.HTTP_400_BAD_REQUEST)


    
    def extract_emotions(self, face_analysis):
        """Extract emotions from face analysis"""
        emotions = []
        for face in face_analysis:
            emotions.append({
                'emotion': face.get('emotion', 'neutral'),
                'confidence': face.get('confidence', 0.5)
            })
        return emotions

    # @action(detail=True, methods=['post'])
    # def reanalyse(self, request, pk=None):
    #     """Enhanced reanalysis with advanced AI"""
    #     media = self.get_object()
    #     file = media.file
        
    #     try:
    #         analysis = ai_service.analyze_media(file)
            
    #         # Update all analysis fields
    #         media.media_type = analysis['media_type']
    #         media.quality_score = analysis['quality_score']
    #         media.theme = analysis['theme']
    #         media.tags = ', '.join(analysis['tags'][:8])
    #         media.objects_detected = analysis.get('objects_detected', [])
    #         media.faces_detected = analysis.get('face_analysis', [])
    #         media.emotions = self.extract_emotions(analysis.get('face_analysis', []))
    #         media.scene_context = analysis.get('scene_analysis', {}).get('primary_scene', 'General')
    #         media.audio_analysis = analysis.get('audio_features', {})
    #         media.analysis_summary = analysis['summary']
    #         media.ai_models_used = ', '.join(analysis['ai_models_used'])
    #         media.save()
            
    #     except Exception as e:
    #         return Response({'error': 'Reanalysis failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    #     return Response(MediaSerializer(media).data)
    
    # Update the reanalyse method in views.py
@action(detail=True, methods=['post'])
def reanalyse(self, request, pk=None):
    """Enhanced reanalysis with all AI models"""
    media = self.get_object()
    file = media.file
    
    try:
        # Use the enhanced AI service
        analysis = ai_service.analyze_media(file)
        
        # Update all analysis fields with enhanced data
        media.media_type = analysis['media_type']
        media.quality_score = analysis['quality_score']
        media.theme = analysis['theme']
        media.tags = ', '.join(analysis['tags'][:8])
        
        # Enhanced object detection
        media.objects_detected = analysis.get('objects_detected', [])
        
        # Enhanced face analysis
        media.faces_detected = analysis.get('face_analysis', [])
        
        # Enhanced emotions
        media.emotions = self.extract_enhanced_emotions(analysis.get('face_analysis', []))
        
        # Enhanced scene context
        scene_data = analysis.get('scene_analysis', {})
        media.scene_context = scene_data.get('primary_scene', 'General')
        
        # Enhanced audio analysis
        media.audio_analysis = analysis.get('audio_analysis', {})
        
        # Enhanced summary
        media.analysis_summary = analysis['summary']
        
        # AI models used
        media.ai_models_used = ', '.join(analysis['ai_models_used'])
        
        media.save()
        
    except Exception as e:
        print(f"Enhanced reanalysis failed: {e}")
        return Response({'error': 'Reanalysis failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(MediaSerializer(media).data)

def extract_enhanced_emotions(self, face_analysis):
    """Extract enhanced emotions from face analysis"""
    emotions = []
    for face in face_analysis:
        emotions.append({
            'emotion': face.get('emotion', 'neutral'),
            'confidence': face.get('confidence', 0.5),
            'gender': face.get('gender', 'unknown'),
            'age': face.get('age', 'unknown')
        })
    return emotions