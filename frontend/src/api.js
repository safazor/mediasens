import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// ✅ Intercepteur : ajoute le token UNIQUEMENT pour les routes protégées
api.interceptors.request.use((config) => {
  const access = localStorage.getItem("access");

  // Liste des endpoints publics → pas besoin de token
  const isPublic =
    config.url.includes("/api/auth/login/") ||
    config.url.includes("/api/auth/register/") ||
    config.url.includes("/api/auth/refresh/") ||
    config.url.includes("/api/chat/") || // ✅ chatbot
    config.url.includes("/api/generation/"); // ✅ endpoints publics (génération & récents)

  if (access && !isPublic) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

export default api;
