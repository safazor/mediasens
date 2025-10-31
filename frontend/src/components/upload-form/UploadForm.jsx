// components/upload-form/UploadForm.jsx
"use client"

import { useState } from "react"
import "./UploadForm.css"

const UploadForm = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file) => {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      alert("Le fichier est trop volumineux. Taille maximale: 50MB")
      return
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm',
      'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/aac', 'audio/ogg'
    ]

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|mp4|mov|avi|mkv|webm|mp3|wav|m4a|flac|aac|ogg)$/i)) {
      alert("Type de fichier non supporté. Formats acceptés: Images, Vidéos, Audio")
      return
    }

    setFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      alert("Veuillez sélectionner un fichier")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://localhost:8000/api/media/", {
        method: "POST",
        body: formData,
      })

      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      if (response.ok) {
        clearInterval(interval)
        setUploadProgress(100)
        const data = await response.json()
        setFile(null)
        setTimeout(() => {
          onUploadSuccess(data)
          alert("✅ Fichier téléversé et analysé avec l'IA avancée !")
        }, 500)
      } else {
        clearInterval(interval)
        const errorData = await response.json()
        alert(`❌ Échec du téléversement: ${errorData.error || 'Erreur inconnue'}`)
      }
    } catch (error) {
      console.error("Erreur de téléversement:", error)
      alert("❌ Erreur de connexion au serveur")
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const getFileIcon = (file) => {
    if (!file) return "📁"
    
    if (file.type.startsWith('image/')) return "🖼️"
    if (file.type.startsWith('video/')) return "🎥"
    if (file.type.startsWith('audio/')) return "🎵"
    
    const ext = file.name.split('.').pop().toLowerCase()
    const icons = {
      'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️', 'bmp': '🖼️',
      'mp4': '🎥', 'mov': '🎥', 'avi': '🎥', 'mkv': '🎥', 'webm': '🎥',
      'mp3': '🎵', 'wav': '🎵', 'm4a': '🎵', 'flac': '🎵', 'aac': '🎵', 'ogg': '🎵'
    }
    
    return icons[ext] || "📁"
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="upload-form bg-white/5 border border-white/10 rounded-2xl p-8 text-center shadow-lg shadow-black/40">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">🚀 Téléverser un média</h2>
        <p className="text-white/60 text-sm">
          Analyse IA avancée avec YOLOv8, DeepFace, Transformers, Whisper et plus encore
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div
          className={`drag-drop-area ${dragActive ? "active" : ""} mb-6 relative`}
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
            accept="image/*,video/*,audio/*,.mp3,.wav,.m4a,.flac,.aac,.ogg,.mp4,.mov,.avi,.mkv,.webm"
          />
          <label htmlFor="file-input" className="drag-drop-label">
            {file ? (
              <div className="text-center">
                <div className="text-4xl mb-3">{getFileIcon(file)}</div>
                <p className="text-green-400 font-semibold">✓ Fichier sélectionné</p>
                <p className="text-sm mt-1 font-medium">{file.name}</p>
                <p className="text-xs text-white/60 mt-1">{formatFileSize(file.size)}</p>
                <p className="text-xs text-green-400 mt-2">
                  ✅ Prêt pour l'analyse IA avancée
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-4">📤</div>
                <p className="text-lg font-medium">Glissez-déposez votre média ici</p>
                <p className="text-white/70 mt-1">ou cliquez pour sélectionner</p>
                <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-sm font-medium text-white/80 mb-2">Formats supportés:</p>
                  <div className="flex justify-center gap-4 text-xs text-white/60">
                    <span>🖼️ Images</span>
                    <span>🎥 Vidéos</span>
                    <span>🎵 Audio</span>
                  </div>
                </div>
              </div>
            )}
          </label>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-white/60 mt-1">
                {uploadProgress < 100 ? 'Téléversement...' : 'Analyse IA en cours...'}
              </p>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={uploading || !file} 
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        >
          {uploading ? (
            <>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {uploadProgress < 100 ? 'Téléversement...' : 'Analyse IA...'}
              </div>
            </>
          ) : (
            <>
              🚀 Lancer l'analyse IA avancée
            </>
          )}
        </button>

        {/* AI Models Info */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-white/60 mb-2">Modèles IA disponibles:</p>
          <div className="flex flex-wrap justify-center gap-1 text-xs">
            <span className="px-2 py-1 bg-green-600/30 rounded">YOLOv8</span>
            <span className="px-2 py-1 bg-blue-600/30 rounded">DeepFace</span>
            <span className="px-2 py-1 bg-purple-600/30 rounded">Transformers</span>
            <span className="px-2 py-1 bg-yellow-600/30 rounded">Whisper</span>
            <span className="px-2 py-1 bg-indigo-600/30 rounded">EfficientNet</span>
          </div>
        </div>
      </form>
    </div>
  )
}

export default UploadForm