# editing_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EditingProjectViewSet, VideoProjectViewSet

router = DefaultRouter()
router.register(r'projects', EditingProjectViewSet)
router.register(r'video-projects', VideoProjectViewSet)  # ✅ AJOUT

urlpatterns = [
    path('', include(router.urls)),
]