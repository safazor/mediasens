from rest_framework import viewsets, permissions
from .models import MediaProject
from .serializers import MediaProjectSerializer

class MediaProjectViewSet(viewsets.ModelViewSet):
    queryset = MediaProject.objects.all().order_by('-created_at')
    serializer_class = MediaProjectSerializer
    permission_classes = [permissions.AllowAny]
