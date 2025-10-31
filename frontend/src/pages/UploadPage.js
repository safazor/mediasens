import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadForm from "../components/upload-form/UploadForm";
import { Link } from "react-router-dom";

export default function UploadPage() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Charger les fichiers existants
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/media/");
      setMediaList(response.data);
    } catch (err) {
      console.error("Erreur de chargement :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUploaded = (newMedia) => {
    setMediaList([newMedia, ...mediaList]);
  };

  const handleMediaDeleted = (mediaId) => {
    setMediaList(mediaList.filter((m) => m.id !== mediaId));
  };

  const filteredMedia = mediaList.filter((item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.theme?.toLowerCase().includes(query) ||
      item.tags?.toLowerCase().includes(query) ||
      item.media_type?.toLowerCase().includes(query) ||
      item.analysis_summary?.toLowerCase().includes(query) ||
      item.ai_models_used?.toLowerCase().includes(query)
    );
  });

  const getFileIcon = (item) => {
    if (item.file.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) return "🖼️";
    if (item.file.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return "🎥";
    if (item.file.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i)) return "🎵";
    return "📁";
  };

  const getQualityColor = (score) => {
    if (!score) return "text-white/60";
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6">
      {/* 🧭 En-tête */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Gestion intelligente des médias
          </span>
        </h1>
        <p className="text-white/70 mt-3 max-w-2xl mx-auto">
          Téléversez vos fichiers et laissez Mediasens les classer automatiquement grâce à l'analyse IA avancée.
        </p>
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <span className="px-3 py-1 bg-green-600/30 rounded-full text-xs border border-green-500/30">YOLOv8</span>
          <span className="px-3 py-1 bg-blue-600/30 rounded-full text-xs border border-blue-500/30">DeepFace</span>
          <span className="px-3 py-1 bg-purple-600/30 rounded-full text-xs border border-purple-500/30">Transformers</span>
          <span className="px-3 py-1 bg-yellow-600/30 rounded-full text-xs border border-yellow-500/30">Whisper</span>
          <span className="px-3 py-1 bg-indigo-600/30 rounded-full text-xs border border-indigo-500/30">EfficientNet</span>
        </div>
      </div>

      {/* 🗂️ Formulaire d'upload (Component) */}
      <div className="max-w-3xl mx-auto">
        <UploadForm onUploadSuccess={handleMediaUploaded} />
      </div>

      {/* 🖼️ Galerie des fichiers */}
      <div className="max-w-7xl mx-auto mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">🖼️ Galerie des médias</h2>
          <div className="text-sm text-white/60">
            {filteredMedia.length} média{filteredMedia.length !== 1 ? 'x' : ''} trouvé{filteredMedia.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* 🔍 Barre de recherche et filtres */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Rechercher par thème, tags, type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            ❌
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-white/60 mt-4">Chargement des médias...</p>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-white/60 text-lg">
              {searchQuery ? "Aucun média ne correspond à votre recherche." : "Aucun média pour l'instant."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg hover:opacity-90 transition"
              >
                Voir tous les médias
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition group"
              >
                <Link to={`/media/${item.id}`}>
                  {/* Aperçu du média */}
                  <div className="aspect-[16/9] bg-black/30 flex items-center justify-center rounded-lg overflow-hidden cursor-pointer relative">
                    {item.file.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                      <img
                        src={`${item.file}`}
                        alt="preview"
                        className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                      />
                    ) : item.file.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
                      <div className="relative w-full h-full">
                        <img
                          src="/mp4.png"
                          alt="video placeholder"
                          className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-4xl">🎥</div>
                        </div>
                      </div>
                    ) : item.file.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i) ? (
                      <div className="relative w-full h-full">
                        <img
                          src="/mp3.jpg"
                          alt="audio placeholder"
                          className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-4xl">🎵</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/60">
                        <span className="text-4xl mb-2">{getFileIcon(item)}</span>
                        <p className="text-sm text-center px-2">{item.file.split("/").pop()}</p>
                      </div>
                    )}
                    
                    {/* Overlay avec infos rapides */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                      <div className="flex flex-wrap gap-1">
                        {item.ai_models_used && item.ai_models_used.split(',').slice(0, 2).map((model, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-green-600/80 rounded text-xs border border-green-500/80 backdrop-blur-sm">
                            {model.trim()}
                          </span>
                        ))}
                        {item.ai_models_used && item.ai_models_used.split(',').length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-600/80 rounded text-xs backdrop-blur-sm">
                            +{item.ai_models_used.split(',').length - 2}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getQualityColor(item.quality_score)} bg-black/50`}>
                        {item.quality_score ? `${(item.quality_score * 100).toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>

                    {/* Objets détectés preview */}
                    {item.objects_detected && item.objects_detected.length > 0 && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {item.objects_detected.slice(0, 3).map((obj, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-600/80 rounded text-xs border border-blue-500/80 backdrop-blur-sm">
                              {obj.label}
                            </span>
                          ))}
                          {item.objects_detected.length > 3 && (
                            <span className="px-2 py-1 bg-gray-600/80 rounded text-xs backdrop-blur-sm">
                              +{item.objects_detected.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  {/* Métadonnées IA améliorées */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFileIcon(item)}</span>
                        <span className="font-medium text-sm truncate">
                          {item.media_type || "Inconnu"}
                        </span>
                      </div>
                      {item.faces_detected && item.faces_detected.length > 0 && (
                        <span className="px-2 py-1 bg-pink-600/30 rounded text-xs border border-pink-500/30">
                          {item.faces_detected.length} 😊
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-white/90 truncate" title={item.theme}>
                        {item.theme || "—"}
                      </p>
                      {item.analysis_summary && (
                        <p className="text-xs text-white/60 mt-1 line-clamp-2" title={item.analysis_summary}>
                          {item.analysis_summary}
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.split(',').slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-1.5 py-0.5 bg-blue-600/30 rounded text-xs border border-blue-500/30">
                            {tag.trim()}
                          </span>
                        ))}
                        {item.tags.split(',').length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-600/30 rounded text-xs">
                            +{item.tags.split(',').length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 🔄 Réanalyser & 🗑 Supprimer */}
                  <div className="flex gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await axios.post(
                            `http://localhost:8000/api/media/${item.id}/reanalyse/`
                          );
                          alert("✅ Média réanalysé avec l'IA avancée !");
                          fetchMedia(); // Refresh the list
                        } catch (error) {
                          alert("❌ Erreur lors de la réanalyse");
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-xs hover:opacity-80 transition flex items-center justify-center gap-1"
                    >
                      <span>🔄</span>
                      <span>IA Avancée</span>
                    </button>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce média ?")) {
                          try {
                            await axios.delete(
                              `http://localhost:8000/api/media/${item.id}/`
                            );
                            alert("✅ Média supprimé !");
                            handleMediaDeleted(item.id);
                          } catch (error) {
                            alert("❌ Erreur lors de la suppression");
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 rounded-lg text-xs hover:opacity-80 transition flex items-center justify-center gap-1"
                    >
                      <span>🗑</span>
                      <span>Supprimer</span>
                    </button>
                  </div>

                  {/* Date d'upload */}
                  <div className="text-xs text-white/40 mt-2 text-center">
                    Uploadé le {new Date(item.uploaded_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques globales */}
        {mediaList.length > 0 && (
          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
            <h3 className="font-semibold mb-4 text-lg">📈 Statistiques de la médiathèque</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-purple-400">{mediaList.length}</p>
                <p className="text-sm text-white/60">Médias totaux</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {mediaList.filter(m => m.file.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)).length}
                </p>
                <p className="text-sm text-white/60">Images</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {mediaList.filter(m => m.file.match(/\.(mp4|mov|avi|mkv|webm)$/i)).length}
                </p>
                <p className="text-sm text-white/60">Vidéos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {mediaList.filter(m => m.file.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i)).length}
                </p>
                <p className="text-sm text-white/60">Audios</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}