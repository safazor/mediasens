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
    config.url.includes("/api/chat/"); // ✅ Ajout du chatbot ici

  if (access && !isPublic) {
    config.headers.Authorization = `Bearer ${access}`;
  }

  return config;
});

// ✅ FONCTIONS EXISTANTES (ne pas toucher)
export const loginUser = async (credentials) => {
  const response = await api.post("/api/auth/login/", credentials);
  return response;
};

export const registerUser = async (userData) => {
  const response = await api.post("/api/auth/register/", userData);
  return response;
};

export const uploadMedia = async (file, type) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  
  const response = await api.post("/api/media/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

// ✅ NOUVELLES FONCTIONS POUR TON MODULE 3
export const editingAPI = {
  // Créer un projet d'édition
  createEditingProject: async (formData) => {
    const response = await api.post("/api/editing/projects/", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response;
  },

  // Appliquer un style IA
  applyStyle: async (projectId, styleName) => {
    const response = await api.post(`/api/editing/projects/${projectId}/apply_style/`, {
      style_name: styleName
    });
    return response;
  },

  // Récupérer les projets
  getEditingProjects: async () => {
    const response = await api.get("/api/editing/projects/");
    return response;
  },

  // Récupérer un projet spécifique
  getEditingProject: async (projectId) => {
    const response = await api.get(`/api/editing/projects/${projectId}/`);
    return response;
  },
  applyAdjustments: async (projectId, parameters) => {
    const response = await api.post(`/api/editing/projects/${projectId}/apply_adjustments/`, {
      parameters
    });
    return response;
  },

  applyStyleOnly: async (projectId, styleName) => {
    const response = await api.post(`/api/editing/projects/${projectId}/apply_style_only/`, {
      style_name: styleName
    });
    return response;
  },

  applyBoth: async (projectId, styleName, parameters) => {
    const response = await api.post(`/api/editing/projects/${projectId}/apply_adjustments_and_style/`, {
      style_name: styleName,
      parameters
    });
    return response;
  }
};

// api.js - CORRIGÉ avec détection de visages
export const videoAPI = {
  // Créer un projet vidéo
  createVideoProject: async (formData) => {
    const response = await api.post('/api/editing/video-projects/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  },

  // Appliquer un effet vidéo
  applyVideoEffect: async (projectId, effectName) => {
    const response = await api.post(`/api/editing/video-projects/${projectId}/apply_video_effect/`, {
      effect_name: effectName
    });
    return response;
  },

  // 🔧 REMPLACÉ : Détection de scènes → Détection de visages
  detectFaces: async (projectId) => {
    const response = await api.post(`/api/editing/video-projects/${projectId}/detect_faces/`, {});
    return response;
  },

  // 🔧 CORRIGÉ : Générer les sous-titres avec support FR/EN
  generateSubtitles: async (projectId, language = 'fr') => {
    const response = await api.post(`/api/editing/video-projects/${projectId}/generate_subtitles/`, {
      language: language
    });
    return response;
  },

  // Récupérer les scènes (optionnel - si tu veux garder l'ancienne fonctionnalité)
  getScenes: async (projectId) => {
    const response = await api.get(`/api/editing/video-projects/${projectId}/scenes/`);
    return response;
  },

  // 🔧 AJOUT : Obtenir les langues supportées
  getSupportedLanguages: async () => {
    const response = await api.get('/api/editing/video-projects/supported_languages/');
    return response;
  }
};

export default api;