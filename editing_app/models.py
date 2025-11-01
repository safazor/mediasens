# editing_app/models.py
from django.db import models
from django.contrib.auth.models import User

class EditingProject(models.Model):
    name = models.CharField(max_length=255)
    original_image = models.ImageField(upload_to='editing/original/')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    
    def __str__(self):
        return self.name

class StyleTransferResult(models.Model):
    project = models.ForeignKey(EditingProject, on_delete=models.CASCADE)
    style_name = models.CharField(max_length=100)
    result_image = models.ImageField(upload_to='editing/results/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.style_name}"

# ✅ AJOUTEZ CES MODÈLES VIDÉO
class VideoProject(models.Model):
    name = models.CharField(max_length=255)
    original_video = models.FileField(upload_to='videos/original/')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    
    def __str__(self):
        return self.name

class VideoEffectResult(models.Model):
    project = models.ForeignKey(VideoProject, on_delete=models.CASCADE)
    effect_name = models.CharField(max_length=100)
    processed_video = models.FileField(upload_to='videos/processed/')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.project.name} - {self.effect_name}"

class VideoScene(models.Model):
    project = models.ForeignKey(VideoProject, on_delete=models.CASCADE)
    start_time = models.FloatField()
    end_time = models.FloatField()
    scene_type = models.CharField(max_length=50, default='scene_change')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.project.name} - Scene {self.start_time}-{self.end_time}"