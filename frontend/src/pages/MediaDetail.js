// pages/MediaDetail.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdvancedMediaAnalysis from "../components/advanced-media-analysis/AdvancedMediaAnalysis";

export default function MediaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    fetchMediaDetail();
  }, [id]);

  const fetchMediaDetail = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/media/${id}/`);
      setMedia(response.data);
      setLoading(false);
    } catch (err) {
      setError("Erreur de chargement du média");
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      await axios.post(`http://localhost:8000/api/media/${id}/reanalyse/`);
      alert("Média réanalysé avec les modèles IA avancés !");
      fetchMediaDetail(); // Refresh the data
    } catch (error) {
      alert("Erreur lors de la réanalyse");
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-white/60">Chargement du média...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:opacity-90"
        >
          ← Retour
        </button>
      </div>
    </div>
  );

  if (!media) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/60">Média non trouvé</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:opacity-90"
        >
          ← Retour
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition mb-6 flex items-center gap-2"
        >
          ← Retour à la galerie
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Détails du média
              </span>
            </h1>
            <p className="text-white/60">Analyse IA complète avec modèles avancés</p>
          </div>
          
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {reanalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Réanalyse en cours...
              </>
            ) : (
              <>
                🔄 Réanalyser avec IA avancée
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
        {/* Media Preview & Basic Info */}
        <div className="space-y-6">
          {/* Media Preview */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📁 Aperçu du média
              {media.ai_models_used && (
                <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
                  {media.ai_models_used.split(',').length} modèles IA
                </span>
              )}
            </h2>
            
            <div className="aspect-[16/9] bg-black/30 rounded-lg overflow-hidden mb-4 border border-white/10">
              {media.file.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                <img
                  src={media.file}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
              ) : media.file.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
                <video controls className="w-full h-full">
                  <source src={media.file} type="video/mp4" />
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>
              ) : media.file.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i) ? (
                <div className="flex items-center justify-center h-full bg-purple-900/20">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">🎵</div>
                    <p className="text-white/70 text-lg mb-4">Fichier audio analysé</p>
                    <audio controls className="w-full max-w-md">
                      <source src={media.file} type="audio/mpeg" />
                    </audio>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <span className="text-6xl mb-4">📄</span>
                    <p className="text-white/60 text-lg">{media.file.split("/").pop()}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Type</p>
                  <p className="font-medium">{media.media_type || "Inconnu"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Thème IA</p>
                  <p className="font-medium">{media.theme || "—"}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Qualité IA</p>
                  <p className="font-medium">
                    {media.quality_score ? `${(media.quality_score * 100).toFixed(0)}%` : "—"}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm">Scène</p>
                  <p className="font-medium">{media.scene_context || "—"}</p>
                </div>
              </div>

              {/* AI Models Used */}
              {media.ai_models_used && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm mb-2">Modèles IA utilisés</p>
                  <div className="flex flex-wrap gap-1">
                    {media.ai_models_used.split(',').map((model, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-600/30 rounded text-xs border border-purple-500/30">
                        {model.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {media.tags && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/60 text-sm mb-2">Tags IA</p>
                  <div className="flex flex-wrap gap-1">
                    {media.tags.split(',').slice(0, 8).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-600/30 rounded text-xs border border-blue-500/30">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleReanalyze}
                disabled={reanalyzing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {reanalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analyse...
                  </>
                ) : (
                  <>
                    🔄 Réanalyser
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce média ?")) {
                    try {
                      await axios.delete(`http://localhost:8000/api/media/${media.id}/`);
                      alert("Média supprimé !");
                      navigate(-1);
                    } catch (error) {
                      alert("Erreur lors de la suppression");
                    }
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 rounded-lg text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                🗑 Supprimer
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-sm text-white/60">Objets</p>
              <p className="text-lg font-bold">
                {media.objects_detected?.length || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl mb-2">😊</div>
              <p className="text-sm text-white/60">Visages</p>
              <p className="text-lg font-bold">
                {media.faces_detected?.length || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl mb-2">🏷️</div>
              <p className="text-sm text-white/60">Tags</p>
              <p className="text-lg font-bold">
                {media.tags?.split(',').length || 0}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl mb-2">🤖</div>
              <p className="text-sm text-white/60">Modèles IA</p>
              <p className="text-lg font-bold">
                {media.ai_models_used?.split(',').length || 1}
              </p>
            </div>
          </div>
        </div>

        {/* Advanced AI Analysis */}
        <div>
          <AdvancedMediaAnalysis media={media} />
        </div>
      </div>
    </div>
  );
}