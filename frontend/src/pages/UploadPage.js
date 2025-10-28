/* Page séparée : Module 1 - Gestion intelligente des médias (style Mediasens) */
import React, { useState, useEffect } from "react";
import axios from "axios";
import UploadForm from "../components/upload-form/UploadForm";
import { Link } from "react-router-dom";
import AdvancedMediaAnalysis from "../components/advanced-media-analysis/AdvancedMediaAnalysis";

export default function UploadPage() {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les fichiers existants
  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/media/");
      setMediaList(response.data);
    } catch (err) {
      console.error("Erreur de chargement :", err);
    }
  };

  const handleMediaUploaded = (newMedia) => {
    setMediaList([newMedia, ...mediaList]);
  };

  const handleMediaDeleted = (mediaId) => {
    setMediaList(mediaList.filter((m) => m.id !== mediaId));
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
          Téléversez vos fichiers et laissez Mediasens les classer automatiquement grâce à l'analyse IA.
        </p>
      </div>

      {/* 🗂️ Formulaire d'upload (Component) */}
      <div className="max-w-3xl mx-auto">
        <UploadForm onUploadSuccess={handleMediaUploaded} />
      </div>

      {/* 🖼️ Galerie des fichiers */}
      <div className="max-w-6xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-6">🖼️ Galerie des fichiers</h2>

        {/* 🔍 Barre de recherche */}
        <input
          type="text"
          placeholder="Rechercher par nom, thème ou tag..."
          onChange={(e) => {
            const query = e.target.value.toLowerCase();
            if (query === "") {
              fetchMedia(); // Reset to all media when search is empty
            } else {
              setMediaList((prevList) =>
                prevList.filter(
                  (item) =>
                    item.theme?.toLowerCase().includes(query) ||
                    item.tags?.toLowerCase().includes(query) ||
                    item.media_type?.toLowerCase().includes(query)
                )
              );
            }
          }}
          className="w-full mb-6 p-3 rounded-lg bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500"
        />

        {mediaList.length === 0 ? (
          <p className="text-white/60 text-center">Aucun média pour l'instant.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition"
              >
               <Link to={`/media/${item.id}`}>
  {/* Aperçu du média */}
  <div className="aspect-[16/9] bg-black/30 flex items-center justify-center rounded-lg overflow-hidden cursor-pointer">
    {item.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
      <img
        src={`${item.file}`}
        alt="preview"
        className="object-cover w-full h-full"
      />
    ) : item.file.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
      // Video placeholder
      <img
        src="/mp4.png"
        alt="video placeholder"
        className="object-cover w-full h-full"
      />
    ) : item.file.match(/\.(mp3|wav|m4a|flac|aac|ogg)$/i) ? (
      // Audio placeholder
      <img
        src="/mp3.jpg"
        alt="audio placeholder"
        className="object-cover w-full h-full"
      />
    ) : item.file.match(/\.(pdf|doc|docx|txt)$/i) ? (
      // PDF/Document placeholder
      <img
        src="/pdf.jpeg"
        alt="document placeholder"
        className="object-cover w-full h-full"
      />
    ) : (
      // Default placeholder for unknown types
      <div className="flex flex-col items-center justify-center text-white/60">
        <span className="text-3xl mb-2">📁</span>
        <p className="text-sm">{item.file.split("/").pop()}</p>
      </div>
    )}
  </div>
</Link>

                <div className="p-4">
                  {/* Métadonnées IA */}
                  <div className="space-y-1 text-xs text-white/70 mb-3">
                    <p>📁 Type : {item.media_type || "Inconnu"}</p>
                    <p>🎨 Thème : {item.theme || "—"}</p>
                    <p>
                      ✨ Qualité :{" "}
                      {item.quality_score
                        ? `${(item.quality_score * 100).toFixed(0)}%`
                        : "—"}
                    </p>
                    <p>🏷️ Tags : {item.tags || "—"}</p>
                  </div>

                  {/* 🔄 Réanalyser & 🗑 Supprimer */}
                  <div className="flex justify-between gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await axios.post(
                            `http://localhost:8000/api/media/${item.id}/reanalyse/`
                          );
                          alert("Média réanalysé !");
                          fetchMedia(); // Refresh the list
                        } catch (error) {
                          alert("Erreur lors de la réanalyse");
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-purple-600 rounded-lg text-xs hover:opacity-80 transition"
                    >
                      🔄 Réanalyser
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
                            alert("Média supprimé !");
                            handleMediaDeleted(item.id);
                          } catch (error) {
                            alert("Erreur lors de la suppression");
                          }
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-red-600 rounded-lg text-xs hover:opacity-80 transition"
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>

{/* <AdvancedMediaAnalysis media={item}  /> */}
              
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}