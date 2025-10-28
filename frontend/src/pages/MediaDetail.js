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
    try {
      await axios.post(`http://localhost:8000/api/media/${id}/reanalyse/`);
      alert("Média réanalysé !");
      fetchMediaDetail(); // Refresh the data
    } catch (error) {
      alert("Erreur lors de la réanalyse");
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
      <div className="max-w-6xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition mb-6"
        >
          ← Retour à la galerie
        </button>
        
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Détails du média
          </span>
        </h1>
        <p className="text-white/60">Analyse complète du fichier</p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Media Preview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📁 Aperçu du média</h2>
          
          <div className="aspect-[16/9] bg-black/30 rounded-lg overflow-hidden mb-4">
            {media.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={media.file}
                alt="preview"
                className="object-cover w-full h-full"
              />
            ) : media.file.match(/\.(mp4|mov|avi)$/i) ? (
              <video controls className="w-full h-full">
                <source src={media.file} type="video/mp4" />
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : media.file.match(/\.(mp3|wav|m4a)$/i) ? (
              <div className="flex items-center justify-center h-full bg-purple-900/20">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎵</div>
                  <p className="text-white/70">Fichier audio</p>
                  <audio controls className="mt-4">
                    <source src={media.file} type="audio/mpeg" />
                  </audio>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-white/60 text-lg">
                  📄 {media.file.split("/").pop()}
                </span>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Type:</span>
              <span className="font-medium">{media.media_type || "Inconnu"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Thème:</span>
              <span className="font-medium">{media.theme || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Qualité:</span>
              <span className="font-medium">
                {media.quality_score ? `${(media.quality_score * 100).toFixed(0)}%` : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Tags:</span>
              <span className="font-medium text-right">{media.tags || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Uploadé le:</span>
              <span className="font-medium">
                {new Date(media.uploaded_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleReanalyze}
              className="flex-1 px-4 py-2 bg-purple-600 rounded-lg text-sm hover:opacity-90 transition"
            >
              🔄 Réanalyser
            </button>
            <button
              onClick={async () => {
                if (window.confirm("Êtes-vous sûr de vouloir supprimer ce média ?")) {
                  await axios.delete(`http://localhost:8000/api/media/${media.id}/`);
                  alert("Média supprimé !");
                  navigate(-1);
                }
              }}
              className="flex-1 px-4 py-2 bg-red-600 rounded-lg text-sm hover:opacity-90 transition"
            >
              🗑 Supprimer
            </button>
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