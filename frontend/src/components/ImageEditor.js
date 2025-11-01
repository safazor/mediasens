"use client"

import { useState, useEffect, useRef } from "react"
import { editingAPI } from "../api"

const ImageEditor = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [currentProject, setCurrentProject] = useState(null)
  const [results, setResults] = useState([])
  const [compareMode, setCompareMode] = useState(false)
  const [selectedResult, setSelectedResult] = useState(null)
  const [activeTab, setActiveTab] = useState("adjustments")

  // ✅ PARAMÈTRES PHOTOSHOP (supprime "intensity" car il n'est plus utilisé)
  const [parameters, setParameters] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hue: 0,
    sharpness: 0,
    blur: 0,
    exposure: 0,
    temperature: 0,
    gamma: 1.0,
    vibrance: 0,
  })

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0])
    setResults([])
    resetParameters()
  }

  const resetParameters = () => {
    setParameters({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      sharpness: 0,
      blur: 0,
      exposure: 0,
      temperature: 0,
      gamma: 1.0,
      vibrance: 0,
    })
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("❌ Veuillez sélectionner une image")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("name", selectedFile.name)
      formData.append("original_image", selectedFile)

      const response = await editingAPI.createEditingProject(formData)
      setCurrentProject(response.data)
      setMessage("✅ Image uploadée avec succès ! Utilisez les paramètres d'édition.")
      setResults([])
    } catch (error) {
      setMessage("❌ Erreur lors de l'upload")
      console.error("Upload error:", error)
    }

    setLoading(false)
  }

  // ✅ NOUVELLE FONCTION : APPLIQUER SEULEMENT LES PARAMÈTRES
  const applyAdjustments = async () => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une image")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      console.log("🎯 Envoi des paramètres:", parameters) // Debug

      const response = await editingAPI.applyAdjustments(currentProject.id, parameters)
      const newResult = response.data

      setMessage("✅ Réglages appliqués avec succès !")
      console.log("✅ Résultat reçu:", newResult)

      setResults((prevResults) => [...prevResults, newResult])
      setSelectedResult(newResult)
    } catch (error) {
      setMessage("❌ Erreur avec les réglages")
      console.error("Adjustments error:", error)
      console.error("Détails erreur:", error.response?.data)
    }

    setLoading(false)
  }

  // ✅ NOUVELLE FONCTION : APPLIQUER SEULEMENT LE STYLE
  const applyStyleOnly = async (styleName) => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une image")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      console.log("🎨 Application du style:", styleName) // Debug

      const response = await editingAPI.applyStyleOnly(currentProject.id, styleName)
      const newResult = response.data

      setMessage(`✅ ${getStyleLabel(styleName)} appliqué avec succès !`)
      console.log("✅ Résultat reçu:", newResult)

      setResults((prevResults) => [...prevResults, newResult])
      setSelectedResult(newResult)
    } catch (error) {
      setMessage(`❌ Erreur avec le style ${getStyleLabel(styleName)}`)
      console.error("Style error:", error)
      console.error("Détails erreur:", error.response?.data)
    }

    setLoading(false)
  }

  // ✅ NOUVELLE FONCTION : APPLIQUER PARAMÈTRES + STYLE
  const applyBoth = async (styleName) => {
    if (!currentProject) {
      setMessage("❌ Veuillez d'abord uploader une image")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      console.log("🚀 Application paramètres + style:", parameters, styleName) // Debug

      const response = await editingAPI.applyBoth(currentProject.id, styleName, parameters)
      const newResult = response.data

      setMessage(`✅ ${getStyleLabel(styleName)} + réglages appliqués avec succès !`)
      console.log("✅ Résultat reçu:", newResult)

      setResults((prevResults) => [...prevResults, newResult])
      setSelectedResult(newResult)
    } catch (error) {
      setMessage(`❌ Erreur avec ${getStyleLabel(styleName)} + réglages`)
      console.error("Both error:", error)
      console.error("Détails erreur:", error.response?.data)
    }

    setLoading(false)
  }

  const debounceTimerRef = useRef(null)

  const handleParameterChange = (param, value) => {
    setParameters((prev) => ({
      ...prev,
      [param]: value,
    }))

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer to apply adjustments after 500ms of no changes
    debounceTimerRef.current = setTimeout(() => {
      if (currentProject) {
        applyAdjustmentsRealtime()
      }
    }, 500)
  }

  const applyAdjustmentsRealtime = async () => {
    if (!currentProject) return

    try {
      const response = await editingAPI.applyAdjustments(currentProject.id, parameters)
      const newResult = response.data

      setResults((prevResults) => {
        // Replace the last adjustment result if it exists, otherwise add new
        const lastResult = prevResults[prevResults.length - 1]
        if (lastResult && lastResult.style_name === "adjustment") {
          return [...prevResults.slice(0, -1), newResult]
        }
        return [...prevResults, newResult]
      })
      setSelectedResult(newResult)
    } catch (error) {
      console.error("Real-time adjustment error:", error)
    }
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const getStyleLabel = (styleName) => {
    const styles = {
      van_gogh: "Van Gogh",
      sketch: "Croquis",
      warm: "Chaud",
      vintage: "Vintage",
      cool: "Cool",
      pop_art: "Pop Art",
      noir: "Noir",
      pixel_art: "Pixel Art",
      mirror: "Miroir",
      blur_dream: "Rêve",
      solarize: "Solarisation",
    }
    return styles[styleName] || styleName
  }

  const styles = [
    { name: "van_gogh", label: "Van Gogh", icon: "🎨", gradient: "from-purple-500 to-indigo-600" },
    { name: "sketch", label: "Croquis", icon: "✏️", gradient: "from-slate-600 to-slate-800" },
    { name: "warm", label: "Chaud", icon: "🔥", gradient: "from-orange-500 to-red-600" },
    { name: "vintage", label: "Vintage", icon: "📻", gradient: "from-amber-500 to-orange-700" },
    { name: "cool", label: "Cool", icon: "🧊", gradient: "from-cyan-400 to-blue-600" },
    { name: "pop_art", label: "Pop Art", icon: "🟡", gradient: "from-pink-500 to-rose-600" },
    { name: "noir", label: "Noir", icon: "🎬", gradient: "from-gray-800 to-black" },
    { name: "pixel_art", label: "Pixel Art", icon: "👾", gradient: "from-green-500 to-emerald-600" },
    { name: "mirror", label: "Miroir", icon: "🪞", gradient: "from-blue-400 to-indigo-500" },
    { name: "blur_dream", label: "Rêve", icon: "💭", gradient: "from-violet-400 to-purple-500" },
    { name: "solarize", label: "Solarisation", icon: "☀️", gradient: "from-yellow-400 to-amber-500" },
  ]

  const SliderControl = ({ label, param, min, max, step = 1, value, icon, color = "blue" }) => {
    const percentage = ((value - min) / (max - min)) * 100

    // Color schemes for different parameters
    const colorSchemes = {
      brightness: { bg: "from-slate-900 via-slate-400 to-white", thumb: "bg-yellow-400", glow: "shadow-yellow-400/50" },
      contrast: { bg: "from-gray-600 via-gray-400 to-white", thumb: "bg-purple-500", glow: "shadow-purple-500/50" },
      saturation: { bg: "from-gray-400 via-pink-400 to-red-500", thumb: "bg-pink-500", glow: "shadow-pink-500/50" },
      hue: {
        bg: "from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500",
        thumb: "bg-indigo-500",
        glow: "shadow-indigo-500/50",
      },
      sharpness: { bg: "from-slate-700 to-cyan-400", thumb: "bg-cyan-400", glow: "shadow-cyan-400/50" },
      blur: { bg: "from-slate-700 to-blue-300", thumb: "bg-blue-400", glow: "shadow-blue-400/50" },
      exposure: {
        bg: "from-slate-800 via-orange-400 to-yellow-200",
        thumb: "bg-orange-400",
        glow: "shadow-orange-400/50",
      },
      temperature: {
        bg: "from-blue-400 via-slate-300 to-orange-500",
        thumb: "bg-orange-400",
        glow: "shadow-orange-400/50",
      },
      gamma: { bg: "from-slate-800 to-slate-300", thumb: "bg-slate-400", glow: "shadow-slate-400/50" },
      vibrance: {
        bg: "from-slate-600 via-purple-400 to-fuchsia-500",
        thumb: "bg-fuchsia-500",
        glow: "shadow-fuchsia-500/50",
      },
    }

    const scheme = colorSchemes[param] || {
      bg: "from-slate-700 to-indigo-500",
      thumb: "bg-indigo-500",
      glow: "shadow-indigo-500/50",
    }

    return (
      <div className="mb-6 group">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-xl filter drop-shadow-lg">{icon}</span>
            <span className="tracking-wide">{label}</span>
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full ${scheme.thumb} text-white shadow-lg min-w-[60px] text-center`}
            >
              {value}
            </span>
            <button
              onClick={() => handleParameterChange(param, param === "gamma" ? 1.0 : 0)}
              className="w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100"
              title="Réinitialiser"
            >
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Background gradient track */}
          <div className={`h-3 rounded-full bg-gradient-to-r ${scheme.bg} shadow-inner`} />

          {/* Progress fill with glow effect */}
          <div
            className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r ${scheme.bg} opacity-80 transition-all duration-150 ${scheme.glow} shadow-lg`}
            style={{ width: `${percentage}%` }}
          />

          {/* Actual slider input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => handleParameterChange(param, Number.parseFloat(e.target.value))}
            className="absolute top-0 left-0 w-full h-3 opacity-0 cursor-pointer z-10"
          />

          {/* Custom thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${scheme.thumb} border-3 border-slate-900 shadow-xl transition-all duration-150 pointer-events-none ${scheme.glow} group-hover:scale-110`}
            style={{ left: `calc(${percentage}% - 12px)` }}
          >
            <div className="absolute inset-1 rounded-full bg-white/30" />
          </div>
        </div>

        <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
          <span className="font-medium">{min}</span>
          <span className="font-medium">{max}</span>
        </div>
      </div>
    )
  }

  const applyPreset = (adjustments) => {
    // First, reset all parameters to default
    const defaultParams = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      sharpness: 0,
      blur: 0,
      exposure: 0,
      temperature: 0,
      gamma: 1.0,
      vibrance: 0,
    }

    // Merge default params with the preset adjustments
    const newParams = { ...defaultParams, ...adjustments }

    // Update state with the new parameters
    setParameters(newParams)

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Apply adjustments after a short delay
    debounceTimerRef.current = setTimeout(() => {
      if (currentProject) {
        applyAdjustmentsRealtime()
      }
    }, 500)
  }

  const PresetButton = ({ label, icon, adjustments }) => (
    <button
      onClick={() => applyPreset(adjustments)}
      disabled={!currentProject}
      className="flex-1 bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-50 p-3 rounded-xl transition-all duration-200 flex flex-col items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-semibold text-slate-200">{label}</span>
    </button>
  )

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Studio Photo IA Pro</h1>
              <p className="text-xs text-slate-400">{selectedFile ? selectedFile.name : "Aucun fichier"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentProject && selectedResult && (
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                compareMode ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Comparer
            </button>
          )}

          <button
            onClick={resetParameters}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset
          </button>

          <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 flex items-center gap-2 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Ouvrir
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={loading} />
          </label>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Traitement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Charger
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ... (la partie affichage image reste identique) ... */}
        <div className="flex-1 bg-slate-800 flex items-center justify-center p-8 relative overflow-auto">
          {/* Même code d'affichage d'image que tu as déjà */}
          {!selectedFile ? (
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-slate-700/50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-600">
                <span className="text-6xl">🖼️</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-2">Aucune image</h3>
              <p className="text-slate-500 mb-6">Ouvrez une image pour commencer l'édition</p>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium cursor-pointer transition-all duration-200 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                Sélectionner une image
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          ) : compareMode && selectedResult ? (
            <div className="w-full h-full flex items-center justify-center gap-4">
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl">
                <div className="bg-slate-700 px-4 py-2 rounded-t-lg text-sm font-medium text-slate-300">Original</div>
                <img
                  src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                  alt="Original"
                  className="max-w-full max-h-[70vh] object-contain rounded-b-lg shadow-2xl"
                />
              </div>
              <div className="w-px h-96 bg-slate-600" />
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl">
                <div className="bg-indigo-600 px-4 py-2 rounded-t-lg text-sm font-medium">Modifié</div>
                <img
                  src={`http://127.0.0.1:8000${selectedResult.result_image}`}
                  alt="Modifié"
                  className="max-w-full max-h-[70vh] object-contain rounded-b-lg shadow-2xl"
                />
              </div>
            </div>
          ) : selectedResult ? (
            <div className="relative">
              <img
                src={`http://127.0.0.1:8000${selectedResult.result_image}`}
                alt="Image éditée"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span className="text-xl">{styles.find((s) => s.name === selectedResult.style_name)?.icon}</span>
                {styles.find((s) => s.name === selectedResult.style_name)?.label}
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={URL.createObjectURL(selectedFile) || "/placeholder.svg"}
                alt="Image originale"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium">
                Image originale
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 mx-auto mb-4 text-indigo-500" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path className="opacity-75" fill="currentColor" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-lg font-medium text-white">Traitement en cours...</p>
              </div>
            </div>
          )}
        </div>

        <div className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab("adjustments")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "adjustments"
                  ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              🎛️ Réglages
            </button>
            <button
              onClick={() => setActiveTab("styles")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === "styles"
                  ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              ✨ Styles
            </button>
            <button
              onClick={() => setActiveTab("results")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeTab === "results"
                  ? "bg-slate-800 text-white border-b-2 border-indigo-500"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-850"
              }`}
            >
              🎭 Résultats
              {results.length > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                  {results.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "adjustments" ? (
              <div className="space-y-1">
                {!currentProject && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center text-sm text-slate-400">
                    Chargez une image pour utiliser les réglages
                  </div>
                )}

                {currentProject && (
                  <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-3 mb-4 text-center text-xs text-indigo-300 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Les réglages s'appliquent automatiquement
                  </div>
                )}

                {currentProject && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>⚡</span> Préréglages rapides
                    </h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <PresetButton
                        label="Lumineux"
                        icon="☀️"
                        adjustments={{ brightness: 30, exposure: 20, contrast: 10 }}
                      />
                      <PresetButton
                        label="Sombre"
                        icon="🌙"
                        adjustments={{ brightness: -30, exposure: -20, contrast: 15 }}
                      />
                      <PresetButton
                        label="Chaud"
                        icon="🔥"
                        adjustments={{ temperature: 40, saturation: 15, vibrance: 20 }}
                      />
                      <PresetButton
                        label="Froid"
                        icon="❄️"
                        adjustments={{ temperature: -40, saturation: 10, vibrance: 15 }}
                      />
                      <PresetButton
                        label="Vif"
                        icon="💥"
                        adjustments={{ saturation: 40, vibrance: 30, contrast: 20, sharpness: 30 }}
                      />
                      <PresetButton label="Doux" icon="🌸" adjustments={{ saturation: -10, blur: 15, contrast: -10 }} />
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-4" />
                  </div>
                )}

                <SliderControl
                  label="Luminosité"
                  param="brightness"
                  min={-100}
                  max={100}
                  value={parameters.brightness}
                  icon="💡"
                />

                <SliderControl
                  label="Contraste"
                  param="contrast"
                  min={-100}
                  max={100}
                  value={parameters.contrast}
                  icon="⚡"
                />

                <SliderControl
                  label="Saturation"
                  param="saturation"
                  min={-100}
                  max={100}
                  value={parameters.saturation}
                  icon="🌈"
                />

                <SliderControl label="Teinte" param="hue" min={-180} max={180} value={parameters.hue} icon="🎨" />

                <SliderControl
                  label="Netteté"
                  param="sharpness"
                  min={0}
                  max={100}
                  value={parameters.sharpness}
                  icon="🔍"
                />

                <SliderControl label="Flou" param="blur" min={0} max={100} value={parameters.blur} icon="😴" />

                <SliderControl
                  label="Exposition"
                  param="exposure"
                  min={-100}
                  max={100}
                  value={parameters.exposure}
                  icon="☀️"
                />

                <SliderControl
                  label="Température"
                  param="temperature"
                  min={-100}
                  max={100}
                  value={parameters.temperature}
                  icon="🌡️"
                />

                <SliderControl
                  label="Gamma"
                  param="gamma"
                  min={0.1}
                  max={3.0}
                  step={0.1}
                  value={parameters.gamma}
                  icon="γ"
                />

                <SliderControl
                  label="Vibrance"
                  param="vibrance"
                  min={-100}
                  max={100}
                  value={parameters.vibrance}
                  icon="💫"
                />
              </div>
            ) : activeTab === "styles" ? (
              <div className="space-y-3">
                {!currentProject && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center text-sm text-slate-400">
                    Chargez une image pour appliquer des styles
                  </div>
                )}
                {styles.map((style) => (
                  <div key={style.name} className="space-y-2">
                    <button
                      onClick={() => applyStyleOnly(style.name)}
                      disabled={loading || !currentProject}
                      className={`w-full bg-gradient-to-r ${style.gradient} p-3 rounded-xl transition-all duration-200 flex items-center gap-3 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 transform`}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <span className="font-semibold text-white flex-1 text-left">{style.label}</span>
                    </button>

                    {/* ✅ BOUTON POUR APPLIQUER STYLE + RÉGLAGES */}
                    <button
                      onClick={() => applyBoth(style.name)}
                      disabled={loading || !currentProject}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white p-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      + réglages
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {results.length === 0 ? (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                    <span className="text-4xl mb-3 block">🎭</span>
                    <p className="text-sm text-slate-400">Aucun résultat pour le moment</p>
                  </div>
                ) : (
                  results.map((result, index) => {
                    const styleConfig = styles.find((s) => s.name === result.style_name)
                    const isSelected = selectedResult?.id === result.id
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedResult(result)}
                        className={`w-full bg-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:bg-slate-750 ${
                          isSelected ? "ring-2 ring-indigo-500 shadow-xl" : "hover:shadow-lg"
                        }`}
                      >
                        <img
                          src={`http://127.0.0.1:8000${result.result_image}`}
                          alt={`Style ${result.style_name}`}
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/300x200?text=Erreur"
                          }}
                        />
                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${styleConfig?.gradient} text-white`}
                            >
                              <span>{styleConfig?.icon}</span>
                              {styleConfig?.label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(result.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          {message && (
            <div
              className={`mx-4 mb-4 p-3 rounded-lg text-sm font-medium ${
                message.includes("✅")
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                  : "bg-rose-900/50 text-rose-300 border border-rose-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Modern slider styles are now handled inline with Tailwind */
      `}</style>
    </div>
  )
}

export default ImageEditor
