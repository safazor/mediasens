from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, UserSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
import requests
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/me/    -> profil courant
    PATCH/PUT /api/auth/me/ -> mettre à jour (first_name, last_name, email)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """
    POST /api/auth/logout/  avec {"refresh": "..."} pour blacklister le refresh token
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
# --- Chat Ollama ---


class ChatView(APIView):
    permission_classes = [AllowAny]  # Tu pourras restreindre plus tard si besoin

    def post(self, request):
        """
        Attend un body: { "messages": [{ "role":"user"|"assistant"|"system", "content":"..." }] }
        Renvoie: { "reply": "..." }
        """
        try:
            messages = request.data.get("messages", [])
            if not isinstance(messages, list) or not messages:
                return Response({"detail": "messages[] requis"}, status=400)

            payload = {
                "model": "qwen2.5:0.5b-instruct",   # <- modèle rapide
                "messages": messages,
                "stream": False
            }
            r = requests.post("http://127.0.0.1:11434/api/chat", json=payload, timeout=60)
            if r.status_code != 200:
                return Response({"detail": "Ollama error", "from_ollama": r.text}, status=502)

            data = r.json()
            reply = (data.get("message") or {}).get("content", "")
            return Response({"reply": reply})
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
