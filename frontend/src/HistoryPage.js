import React, { useEffect, useState } from "react";
import axios from "axios";

export default function HistoryPage({ onBack }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/media/")
      .then((res) => setHistory(res.data))
      .catch((err) => console.error("Erreur d'historique :", err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black text-white py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="mb-8 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition"
        >
          ⬅️ Retour
        </button>

        <h1 className="text-3xl font-bold mb-10 text-center bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
          🕓 Historique des uploads
        </h1>

        {history.length === 0 ? (
          <p className="text-white/60 text-center">Aucun fichier dans l’historique.</p>
        ) : (
          <div className="space-y-6">
            {history.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-md shadow-black/30 flex flex-col md:flex-row gap-4"
              >
                {/* Aperçu */}
                <div className="w-full md:w-1/3 aspect-[16/9] bg-black/30 rounded-lg overflow-hidden flex items-center justify-center">
                  {item.file_url?.match(/\.(mp4|avi|mov|mkv|webm|m4v)$/i) ? (
                    <video src={item.file_url} controls className="object-cover w-full h-full" />
                  ) : (
                    <img src={item.file_url} alt="media" className="object-cover w-full h-full" />
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 text-sm text-white/80">
                  <p>📁 Type : <b>{item.media_type?.toUpperCase() || "Inconnu"}</b></p>
                  <p>🎨 Thème : <b>{item.theme}</b></p>
                  <p>🏷 Tags : {Array.isArray(item.tags) ? item.tags.join(", ") : item.tags}</p>
                  <p>📅 Ajouté le : <b>{new Date(item.uploaded_at).toLocaleString()}</b></p>
                  <p>✨ Qualité : <b>{(item.quality_score * 100).toFixed(0)}%</b></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}