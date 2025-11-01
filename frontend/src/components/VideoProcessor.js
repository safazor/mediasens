"use client"

import { useState, useRef } from "react"
import { videoAPI } from "../api"

const VideoProcessor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentProject, setCurrentProject] = useState(null)
  const [results, setResults] = useState([])
  const [faceAnalysis, setFaceAnalysis] = useState(null)
  const [subtitles, setSubtitles] = useState([])
  const [activeTab, setActiveTab] = useState("effects")
  const [selectedLanguage, setSelectedLanguage] = useState('fr')
  const [showAllSubtitles, setShowAllSubtitles] = useState(false)
  const [showAllFaces, setShowAllFaces] = useState(false)

  const videoRef = useRef(null)

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      setResults([])
      setFaceAnalysis(null)
      setSubtitles([])
      setShowAllSubtitles(false)
      setShowAllFaces(false)
    } else {
      setMessage("❌ Veuillez sélectionner un fichier vidéo")
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("❌ Veuillez sélectionner une vidéo")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("name", selectedFile.name)
      formData.append("original_video", selectedFile)

      const response = await videoAPI.createVideoProject(formData)
      setCurrentProject(response.data)
      setMessage("✅ Vidéo uploadée avec succès !")
    } catch (error) {
      setMessage("❌ Erreur lors de l'upload de la vidéo")
      console.error("Upload error:", error)
    }

    setLoading(false)
  }

  // Appliquer un effet vidéo
  const applyVideoEffect = async (effectName) => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une vidéo")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await videoAPI.applyVideoEffect(currentProject.id, effectName)
      const newResult = response.data

      setMessage(`✅ Effet ${getEffectLabel(effectName)} appliqué avec succès !`)
      setResults(prev => [...prev, newResult])
    } catch (error) {
      setMessage(`❌ Erreur avec l'effet ${getEffectLabel(effectName)}`)
      console.error("Effect error:", error)
    }

    setLoading(false)
  }

  // Détection de visages
  const detectFaces = async () => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une vidéo")
      return
    }

    setLoading(true)
    setMessage("")
    setShowAllFaces(false)

    try {
      const response = await videoAPI.detectFaces(currentProject.id)
      setFaceAnalysis(response.data.face_analysis)
      
      // 🔧 CORRIGÉ : Utiliser most_common_face_count pour le message
      const analysis = response.data.face_analysis.analysis
      const mostCommonCount = analysis.most_common_face_count
      const stability = analysis.detection_stability
      
      let stabilityMessage = ""
      if (stability > 0.7) stabilityMessage = "(détection stable)"
      else if (stability > 0.4) stabilityMessage = "(détection modérée)"
      else stabilityMessage = "(détection variable)"
      
      setMessage(`✅ Analyse des visages terminée ! ${mostCommonCount} personne(s) principale(s) détectée(s) ${stabilityMessage}`)
    } catch (error) {
      setMessage("❌ Erreur lors de la détection des visages")
      console.error("Face detection error:", error)
    }

    setLoading(false)
  }

  // Générer les sous-titres avec support FR/EN
  const generateSubtitles = async (language = 'fr') => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une vidéo")
      return
    }

    setLoading(true)
    setMessage("")
    setShowAllSubtitles(false)

    try {
      const response = await videoAPI.generateSubtitles(currentProject.id, language)
      const result = response.data
      
      setSubtitles(result.subtitles)
      setMessage(`✅ ${result.subtitles.length} sous-titres générés en ${result.language_detected} !`)
    } catch (error) {
      setMessage("❌ Erreur lors de la génération des sous-titres")
      console.error("Subtitles error:", error)
    }

    setLoading(false)
  }

  const getEffectLabel = (effectName) => {
    const effects = {
      cinematic: "Cinématique",
      vintage: "Vintage",
      noir: "Noir et Blanc",
      dreamy: "Rêveur",
      pop_art: "Pop Art"
    }
    return effects[effectName] || effectName
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Fonction pour obtenir les détections de visages à afficher
  const getFacesToDisplay = () => {
    if (!faceAnalysis?.face_detections) return []
    if (showAllFaces) {
      return faceAnalysis.face_detections
    }
    return faceAnalysis.face_detections.slice(0, 5)
  }

  const getSubtitlesToDisplay = () => {
    if (showAllSubtitles) {
      return subtitles
    }
    return subtitles.slice(0, 5)
  }

  const effects = [
    { name: "cinematic", label: "Cinématique", icon: "🎬", description: "Effet film avec contraste augmenté" },
    { name: "vintage", label: "Vintage", icon: "📻", description: "Effet sépia rétro" },
    { name: "noir", label: "Noir et Blanc", icon: "🎭", description: "Film noir classique" },
    { name: "dreamy", label: "Rêveur", icon: "💭", description: "Flou artistique et doux" },
    { name: "pop_art", label: "Pop Art", icon: "🟡", description: "Couleurs vives et saturées" }
  ]

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'auto', name: 'Détection auto', flag: '🌐' }
  ]

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-xl">🎥</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Studio Vidéo IA Pro</h1>
              <p className="text-xs text-slate-400">{selectedFile ? selectedFile.name : "Aucun fichier vidéo"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Ouvrir Vidéo
            <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" disabled={loading} />
          </label>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Traitement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Charger Vidéo
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Zone vidéo principale */}
        <div className="flex-1 bg-slate-800 flex items-center justify-center p-8 relative overflow-auto">
          {!selectedFile ? (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-slate-700/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-600">
                <span className="text-6xl">🎥</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-2">Aucune vidéo</h3>
              <p className="text-slate-500 mb-6">Ouvrez une vidéo pour commencer le traitement</p>
            </div>
          ) : (
            <div className="w-full max-w-4xl">
              <video
                ref={videoRef}
                src={URL.createObjectURL(selectedFile)}
                controls
                className="w-full rounded-lg shadow-2xl"
              />
              
              {/* Résultats traités */}
              {results.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Vidéos traitées :</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {results.map((result, index) => (
                      <div key={index} className="bg-slate-700 rounded-lg overflow-hidden">
                        <video
                          src={`http://127.0.0.1:8000${result.processed_video}`}
                          controls
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                              {getEffectLabel(result.effect_name)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(result.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-red-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-lg font-medium text-white">Traitement vidéo en cours...</p>
                <p className="text-sm text-slate-400 mt-2">Cela peut prendre quelques minutes</p>
              </div>
            </div>
          )}
        </div>

        {/* Panneau de contrôle - CORRIGÉ */}
        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("effects")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "effects"
                  ? "bg-slate-800 text-white border-b-2 border-red-500"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              🎭 Effets
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "analysis"
                  ? "bg-slate-800 text-white border-b-2 border-red-500"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              🔍 Analyse
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "effects" ? (
              <div className="space-y-3">
                {!currentProject && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center text-sm text-slate-400">
                    Chargez une vidéo pour appliquer des effets
                  </div>
                )}

                {effects.map((effect) => (
                  <button
                    key={effect.name}
                    onClick={() => applyVideoEffect(effect.name)}
                    disabled={loading || !currentProject}
                    className={`w-full bg-gradient-to-r from-slate-700 to-slate-800 p-4 rounded-xl transition-all duration-200 flex items-start gap-3 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 transform border border-slate-600`}
                  >
                    <span className="text-2xl">{effect.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-white">{effect.label}</div>
                      <div className="text-xs text-slate-400 mt-1">{effect.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 🔧 CORRIGÉ : Affichage des personnes principales */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span>👥</span> Analyse des Visages
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Détecte et analyse la présence humaine dans la vidéo
                  </p>
                  <button
                    onClick={detectFaces}
                    disabled={loading || !currentProject}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Analyser les Visages
                  </button>

                  {faceAnalysis && (
                    <div className="mt-4">
                      {/* 🔧 CORRIGÉ : Métriques principales avec most_common_face_count */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-700 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            {faceAnalysis.analysis.most_common_face_count} {/* 🔧 CHANGÉ */}
                          </div>
                          <div className="text-xs text-slate-400">Personnes principales</div> {/* 🔧 CHANGÉ */}
                        </div>
                        <div className="bg-slate-700 p-3 rounded-lg text-center">
                          <div className="text-2xl font-bold text-white">
                            {faceAnalysis.analysis.face_presence_percentage}%
                          </div>
                          <div className="text-xs text-slate-400">Présence</div>
                        </div>
                      </div>

                      {/* 🔧 AJOUT : Score de stabilité */}
                      <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Stabilité de détection:</span>
                          <span className={`font-medium ${
                            faceAnalysis.analysis.detection_stability > 0.7 ? 'text-green-400' :
                            faceAnalysis.analysis.detection_stability > 0.4 ? 'text-yellow-400' : 'text-orange-400'
                          }`}>
                          </span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full ${
                              faceAnalysis.analysis.detection_stability > 0.7 ? 'bg-green-500' :
                              faceAnalysis.analysis.detection_stability > 0.4 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${faceAnalysis.analysis.detection_stability * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Recommandations */}
                      {faceAnalysis.analysis.recommendations.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-slate-400 mb-2">Recommandations :</div>
                          <div className="space-y-1">
                            {faceAnalysis.analysis.recommendations.map((rec, index) => (
                              <div key={index} className="text-xs bg-slate-700 p-2 rounded flex items-start gap-2">
                                <span className="text-green-400 mt-0.5">•</span>
                                <span className="text-slate-300">{rec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Détections détaillées */}
                      {faceAnalysis.face_detections.length > 0 && (
                        <div>
                          <div className="text-xs text-slate-400 mb-2 flex justify-between items-center">
                            <span>{faceAnalysis.face_detections.length} détections :</span>
                            {faceAnalysis.face_detections.length > 5 && (
                              <button
                                onClick={() => setShowAllFaces(!showAllFaces)}
                                className="text-purple-400 hover:text-purple-300 text-xs"
                              >
                                {showAllFaces ? "Réduire" : "Tout voir"}
                              </button>
                            )}
                          </div>
                          <div className={`overflow-y-auto space-y-2 ${
                            showAllFaces ? 'max-h-60' : 'max-h-40'
                          }`}>
                            {getFacesToDisplay().map((detection, index) => (
                              <div key={index} className="bg-slate-700 p-3 rounded-lg border border-slate-600">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-medium text-purple-400">
                                    {formatTime(detection.timestamp)}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {detection.face_count} visage(s)
                                  </span>
                                </div>
                                <div className="text-xs text-slate-300">
                                  Positions: {detection.faces.map(face => 
                                    `${face.x}x${face.y}`
                                  ).join(', ')}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {!showAllFaces && faceAnalysis.face_detections.length > 5 && (
                            <div className="text-center mt-2">
                              <span className="text-xs text-slate-500">
                                ... et {faceAnalysis.face_detections.length - 5} autres détections
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sous-titres automatiques (inchangé) */}
                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <span>📝</span> Sous-titres Automatiques
                  </h3>
                  <p className="text-sm text-slate-400 mb-3">
                    Génère des sous-titres avec reconnaissance vocale IA
                  </p>
                  
                  {/* Sélecteur de langue */}
                  <div className="mb-3">
                    <label className="text-xs text-slate-400 block mb-2">Langue :</label>
                    <div className="flex gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang.code)}
                          className={`flex-1 py-2 px-3 rounded text-sm transition-all duration-200 ${
                            selectedLanguage === lang.code
                              ? 'bg-green-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          <span className="mr-1">{lang.flag}</span>
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => generateSubtitles(selectedLanguage)}
                    disabled={loading || !currentProject}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Générer les Sous-titres
                  </button>

                  {subtitles.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-slate-400 mb-2 flex justify-between items-center">
                        <span>{subtitles.length} sous-titres générés :</span>
                        {subtitles.length > 5 && (
                          <button
                            onClick={() => setShowAllSubtitles(!showAllSubtitles)}
                            className="text-green-400 hover:text-green-300 text-xs"
                          >
                            {showAllSubtitles ? "Réduire" : "Tout afficher"}
                          </button>
                        )}
                      </div>
                      <div className={`overflow-y-auto space-y-2 ${
                        showAllSubtitles ? 'max-h-96' : 'max-h-40'
                      }`}>
                        {getSubtitlesToDisplay().map((subtitle, index) => (
                          <div 
                            key={index} 
                            className="bg-slate-700 p-3 rounded-lg border border-slate-600 hover:bg-slate-650 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded">
                                {formatTime(subtitle.start)}
                              </span>
                              <span className="text-xs text-slate-400">
                                Durée: {Math.round((subtitle.end - subtitle.start) * 100) / 100}s
                              </span>
                            </div>
                            <p className="text-sm text-white leading-relaxed">
                              {subtitle.text}
                            </p>
                            {subtitle.confidence && (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 bg-slate-600 rounded-full h-1.5">
                                  <div 
                                    className="bg-green-500 h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(subtitle.confidence * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {Math.round(subtitle.confidence * 100)}% confiance
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {!showAllSubtitles && subtitles.length > 5 && (
                        <div className="text-center mt-3">
                          <span className="text-xs text-slate-500">
                            ... et {subtitles.length - 5} autres sous-titres
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {message && (
            <div className={`mx-4 mb-4 p-3 rounded-lg text-sm font-medium ${
              message.includes("✅")
                ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                : "bg-rose-900/50 text-rose-300 border border-rose-700"
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoProcessor