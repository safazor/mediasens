from django.db import models

class Media(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Vidéo'),
    ]

    file = models.FileField(upload_to='uploads/')
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, blank=True, null=True)  # ✅ Fix ici
    theme = models.CharField(max_length=100, blank=True)
    quality_score = models.FloatField(default=0.0)
    tags = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.media_type or 'inconnu'} - {self.file.name}"
