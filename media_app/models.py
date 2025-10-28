# media_app/models.py
from django.db import models

class Media(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Vidéo'),
        ('audio', 'Audio'),
    ]

    file = models.FileField(upload_to='uploads/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, blank=True, null=True)
    theme = models.CharField(max_length=100, blank=True)
    quality_score = models.FloatField(default=0.0)
    tags = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # 🔥 NEW: Module 2 Analysis Fields
    objects_detected = models.JSONField(default=list, blank=True)  # List of detected objects
    faces_detected = models.JSONField(default=list, blank=True)    # Face analysis data
    emotions = models.JSONField(default=list, blank=True)          # Emotion analysis
    scene_context = models.CharField(max_length=200, blank=True)   # Scene description
    audio_analysis = models.JSONField(default=dict, blank=True)    # Audio features
    analysis_summary = models.TextField(blank=True)                # Overall analysis summary

    def __str__(self):
        return f"{self.media_type or 'inconnu'} - {self.file.name}"