// components/upload-form/UploadForm.js
"use client"

import { useState } from "react"
import "./UploadForm.css"

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert("Veuillez sélectionner un fichier")
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:8000/api/media/", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFile(null)
        onUploadSuccess(data)
        alert("Fichier téléversé avec succès !")
      } else {
        const errorData = await response.json()
        alert(`Échec du téléversement: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error("Erreur de téléversement:", error)
      alert("Erreur de téléversement")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-form bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-lg shadow-black/40">
      <h2 className="text-2xl font-bold mb-6">📤 Téléverser un média</h2>
      <form onSubmit={handleSubmit}>
        <div
          className={`drag-drop-area ${dragActive ? "active" : ""} mb-6`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={handleFileChange}
            id="file-input"
            className="file-input"
            accept="image/*,video/*,audio/*,.mp3,.wav,.m4a"
          />
          <label htmlFor="file-input" className="drag-drop-label">
            {file ? (
              <div>
                <p className="text-green-400">✓ Fichier sélectionné</p>
                <p className="text-sm mt-1">{file.name}</p>
              </div>
            ) : (
              <div>
                <p>Glissez-déposez votre média ici</p>
                <p>ou cliquez pour sélectionner</p>
                <p className="text-sm text-white/60 mt-2">Supports: Images, Vidéos, Audio</p>
              </div>
            )}
          </label>
        </div>

        <button 
          type="submit" 
          disabled={uploading || !file} 
          className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "📤 Téléversement en cours..." : "🚀 Uploader le média"}
        </button>
      </form>
    </div>
  )
}

export default UploadForm