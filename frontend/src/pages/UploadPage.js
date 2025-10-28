/* Page séparée : Module 1 - Gestion intelligente des médias (style Mediasens) */
import React, { useState, useEffect } from "react";
import axios from "axios";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les fichiers existants
  useEffect(() => {
    axios
      .get("http://192.168.146.1:8000/api/media/")
      .then((res) => setMediaList(res.data))
      .catch((err) => console.error("Erreur de chargement :", err));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choisis un fichier avant de téléverser.");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await axios.post("http://192.168.146.1:8000/api/media/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMediaList([res.data, ...mediaList]);
      setFile(null);
    } catch (error) {
      console.error("Erreur d'upload :", error);
      alert("Erreur d'upload !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6">
      {/* 🧭 En-tête */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Module 1 – Gestion intelligente des médias
          </span>
        </h1>
        <p className="text-white/70 mt-3 max-w-2xl mx-auto">
          Téléversez vos fichiers et laissez Mediasens les classer automatiquement grâce à l’analyse IA.
        </p>
      </div>

      {/* 🗂️ Formulaire d’upload */}
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-lg shadow-black/40">
        <form onSubmit={handleUpload}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-white mb-4"
          />
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition"
            >
              {loading ? "Téléversement en cours..." : "Uploader"}
            </button>
          </div>
        </form>
      </div>

      {/* 🖼️ Galerie des fichiers */}
{/* 🖼️ Galerie des fichiers */}
<div className="max-w-6xl mx-auto mt-16">
  <h2 className="text-2xl font-bold mb-6">🖼️ Galerie des fichiers</h2>

  {/* 🔍 Barre de recherche */}
  <input
    type="text"
    placeholder="Rechercher par nom, thème ou tag..."
    onChange={(e) => {
      const query = e.target.value.toLowerCase();
      setMediaList((prevList) =>
        prevList.filter(
          (item) =>
            item.theme.toLowerCase().includes(query) ||
            item.tags.toLowerCase().includes(query) ||
            item.media_type.toLowerCase().includes(query)
        )
      );
    }}
    className="w-full mb-6 p-3 rounded-lg bg-white/10 text-white outline-none focus:ring-2 focus:ring-purple-500"
  />

  {mediaList.length === 0 ? (
    <p className="text-white/60 text-center">Aucun média pour l’instant.</p>
  ) : (
    <div className="grid md:grid-cols-3 gap-6">
      {mediaList.map((item) => (
        <div
          key={item.id}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.07] transition p-4"
        >
          {/* Aperçu du média */}
          <div className="aspect-[16/9] bg-black/30 flex items-center justify-center rounded-lg overflow-hidden">
            {item.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
              <img
                src={`http://192.168.146.1:8000${item.file}`}
                alt="preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-white/60 text-sm">
                📄 {item.file.split("/").pop()}
              </span>
            )}
          </div>

          {/* Métadonnées IA */}
          <div className="mt-3 space-y-1 text-xs text-white/70">
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
          <div className="flex justify-between mt-3">
            <button
              onClick={async () => {
                await axios.post(
                  `http://192.168.146.1:8000/api/media/${item.id}/reanalyse/`
                );
                alert("Média réanalysé !");
                window.location.reload();
              }}
              className="px-3 py-2 bg-purple-600 rounded-lg text-xs hover:opacity-80"
            >
              🔄 Réanalyser
            </button>
            <button
              onClick={async () => {
                await axios.delete(
                  `http://192.168.146.1:8000/api/media/${item.id}/`
                );
                alert("Média supprimé !");
                setMediaList(mediaList.filter((m) => m.id !== item.id));
              }}
              className="px-3 py-2 bg-red-600 rounded-lg text-xs hover:opacity-80"
            >
              🗑 Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

    </div>
  );
}
