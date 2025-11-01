from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from media_app.views import MediaViewSet
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import RegisterView, MeView, LogoutView, ChatView  # + ChatView

# JWT
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # /login
    TokenRefreshView,     # /refresh
)

from accounts.views import RegisterView, MeView, LogoutView

router = routers.DefaultRouter()
router.register(r'media', MediaViewSet, basename='media')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),

    # Auth
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/chat/', ChatView.as_view(), name='chat'),
    # Generation Multimédia
    path('api/generation/', include('generation_multimedia.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
