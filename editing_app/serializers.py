# editing_app/serializers.py
from rest_framework import serializers
from .models import EditingProject, StyleTransferResult, VideoProject, VideoEffectResult, VideoScene

class EditingProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = EditingProject
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')

class StyleTransferResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StyleTransferResult
        fields = '__all__'

# ✅ AJOUTEZ CES SÉRIALISEURS VIDÉO
class VideoProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoProject
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

class VideoEffectResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoEffectResult
        fields = '__all__'

class VideoSceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoScene
        fields = '__all__'