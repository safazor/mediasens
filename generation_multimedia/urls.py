from django.urls import path
from .views import (
    TextToImageView,
    RecentImagesView,
    DeleteImageView,
    TextToVideoView,
    RecentClipsView,
    DeleteClipView,
)
from .views import GenerateSubtitlesView, RecentUploadedClipsView, UploadVideoView, EmbedSubtitlesView, DeleteUploadedClipView

urlpatterns = [
    path('text-to-image/', TextToImageView.as_view(), name='text_to_image'),
    path('recent/', RecentImagesView.as_view(), name='recent_images'),
    path('image/<str:filename>/', DeleteImageView.as_view(), name='delete_image'),
    # Video generation
    path('text-to-video/', TextToVideoView.as_view(), name='text_to_video'),
    path('recent-clips/', RecentClipsView.as_view(), name='recent_clips'),
    path('recent-uploads/', RecentUploadedClipsView.as_view(), name='recent_uploads'),
    path('embed-subtitles/', EmbedSubtitlesView.as_view(), name='embed_subtitles'),
    path('upload-video/', UploadVideoView.as_view(), name='upload_video'),
    path('upload/<str:filename>/', DeleteUploadedClipView.as_view(), name='delete_uploaded_clip'),
    path('clip/<str:filename>/', DeleteClipView.as_view(), name='delete_clip'),
     path('subtitles/', GenerateSubtitlesView.as_view(), name='generate_subtitles'),
]
