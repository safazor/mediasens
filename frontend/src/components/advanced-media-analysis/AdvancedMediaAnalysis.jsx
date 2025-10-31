// components/AdvancedMediaAnalysis.jsx
import React, { useEffect } from 'react';

export default function AdvancedMediaAnalysis({ media }) {

    useEffect(() => {
        console.log("MEDIA ANALYSIS DATA:", media)
    }, [media])

  const renderObjects = () => {
    if (!media.objects_detected || media.objects_detected.length === 0) return null;
    
    const getBboxString = (bbox) => {
      if (!bbox) return 'N/A';
      if (Array.isArray(bbox)) {
        return bbox.join(', ');
      }
      if (typeof bbox === 'object') {
        if (bbox.x1 !== undefined) {
          return `${bbox.x1},${bbox.y1},${bbox.x2},${bbox.y2}`;
        }
        return Object.values(bbox).join(', ');
      }
      return String(bbox);
    };

    const getLabel = (obj) => {
      if (typeof obj.label === 'string') {
        return obj.label.replace('_object', '').replace(/_/g, ' ');
      }
      return 'object';
    };

    const getModelBadge = (obj) => {
      const model = obj.model || 'OpenCV';
      const colors = {
        'YOLOv8': 'bg-green-500/20 border-green-500/50',
        'Transformers': 'bg-blue-500/20 border-blue-500/50',
        'EfficientNet': 'bg-purple-500/20 border-purple-500/50',
        'OpenCV': 'bg-gray-500/20 border-gray-500/50'
      };
      return colors[model] || colors['OpenCV'];
    };

    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-green-300 flex items-center gap-2">
          <span>🎯</span>
          Objets détectés ({media.objects_detected.length})
          <span className="text-xs bg-green-600 px-2 py-1 rounded-full">
            Multi-modèles IA
          </span>
        </h4>
        <div className="flex flex-wrap gap-2">
          {media.objects_detected.slice(0, 12).map((obj, index) => (
            <div 
              key={index} 
              className={`px-3 py-2 rounded-lg text-sm border ${getModelBadge(obj)}`}
              title={`Modèle: ${obj.model || 'OpenCV'} | Confiance: ${(obj.confidence * 100).toFixed(1)}%`}
            >
              <div className="flex items-center gap-2">
                <span>{getLabel(obj)}</span>
                <span className="text-xs opacity-70">({(obj.confidence * 100).toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
        {media.objects_detected.length > 12 && (
          <p className="text-xs text-white/60 mt-2">
            +{media.objects_detected.length - 12} autres objets détectés
          </p>
        )}
      </div>
    );
  };

  const renderFaces = () => {
    if (!media.faces_detected || media.faces_detected.length === 0) return null;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-blue-300 flex items-center gap-2">
          <span>😊</span>
          Analyse des visages ({media.faces_detected.length})
          <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
            {media.faces_detected[0]?.model === 'DeepFace' ? 'DeepFace' : 'OpenCV'}
          </span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {media.faces_detected.slice(0, 4).map((face, index) => (
            <div key={index} className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                <div>
                  <span className="text-white/60">Âge:</span>
                  <p className="font-medium">{face.age || 'Inconnu'}</p>
                </div>
                <div>
                  <span className="text-white/60">Genre:</span>
                  <p className="font-medium">{face.gender || 'Inconnu'}</p>
                </div>
                <div>
                  <span className="text-white/60">Émotion:</span>
                  <p className="font-medium">{face.emotion || 'Neutre'}</p>
                </div>
                <div>
                  <span className="text-white/60">Confiance:</span>
                  <p className="font-medium">{(face.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              {face.race && (
                <div className="text-xs text-white/60 border-t border-blue-500/30 pt-2">
                  Origine: {face.race}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAudioAnalysis = () => {
    if (!media.audio_analysis || Object.keys(media.audio_analysis).length === 0) return null;
    
    const audio = media.audio_analysis;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-yellow-300 flex items-center gap-2">
          <span>🎵</span>
          Analyse Audio Avancée
          <span className="text-xs bg-yellow-600 px-2 py-1 rounded-full">
            Multi-modèles
          </span>
        </h4>
        
        {/* Speech Recognition */}
        {audio.speech_analysis?.transcript && (
          <div className="mb-4 p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
            <h5 className="font-semibold mb-2 text-yellow-200 flex items-center gap-2">
              🗣️ Transcription
              <span className="text-xs bg-yellow-600 px-2 py-1 rounded-full">
                {audio.speech_analysis.model || 'Whisper'}
              </span>
            </h5>
            <p className="text-sm text-white/80 leading-relaxed">
              "{audio.speech_analysis.transcript.slice(0, 200)}
              {audio.speech_analysis.transcript.length > 200 ? '...' : ''}"
            </p>
          </div>
        )}

        {/* Audio Features */}
        {audio.basic_features && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">⏱️</div>
              <p className="text-xs">Durée</p>
              <p className="font-bold text-sm">{audio.basic_features.duration_seconds}s</p>
            </div>
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">🎶</div>
              <p className="text-xs">Tempo</p>
              <p className="font-bold text-sm">{audio.basic_features.tempo_bpm || 'N/A'} BPM</p>
            </div>
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">😊</div>
              <p className="text-xs">Émotion</p>
              <p className="font-bold text-sm">{audio.emotion_analysis?.emotion || 'Neutral'}</p>
            </div>
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">🔊</div>
              <p className="text-xs">Énergie</p>
              <p className="font-bold text-sm">{audio.basic_features.rms_energy?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Music Analysis */}
        {audio.music_analysis && (
          <div className="p-4 bg-purple-600/10 rounded-lg border border-purple-500/30">
            <h5 className="font-semibold mb-2 text-purple-200">🎼 Analyse Musicale</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {audio.music_analysis.key && (
                <div>
                  <span className="text-white/60">Tonalité:</span>
                  <p className="font-medium">{audio.music_analysis.key}</p>
                </div>
              )}
              {audio.music_analysis.beat_strength && (
                <div>
                  <span className="text-white/60">Force rythmique:</span>
                  <p className="font-medium">{audio.music_analysis.beat_strength.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSceneAnalysis = () => {
    if (!media.scene_analysis) return null;
    
    const scene = media.scene_analysis;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-purple-300 flex items-center gap-2">
          <span>🏞️</span>
          Analyse de Scène
          <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">
            {scene.model || 'Transformers'}
          </span>
        </h4>
        
        <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-lg font-semibold">{scene.primary_scene}</p>
              <p className="text-sm text-white/60">Scène principale</p>
            </div>
            <span className="px-3 py-1 bg-purple-700 rounded-full text-sm">
              {(scene.confidence * 100).toFixed(0)}% de confiance
            </span>
          </div>
          
          {scene.alternative_scenes && scene.alternative_scenes.length > 0 && (
            <div>
              <p className="text-sm text-white/60 mb-2">Scènes alternatives:</p>
              <div className="flex flex-wrap gap-2">
                {scene.alternative_scenes.map((alt, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-700/50 rounded text-xs">
                    {alt.scene} ({(alt.confidence * 100).toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderImageClassification = () => {
    if (!media.image_classification) return null;
    
    const classification = media.image_classification;
    
    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-indigo-300 flex items-center gap-2">
          <span>🧠</span>
          Classification d'Image
          <span className="text-xs bg-indigo-600 px-2 py-1 rounded-full">
            {classification.model || 'EfficientNet'}
          </span>
        </h4>
        
        <div className="space-y-2">
          {classification.predictions?.slice(0, 5).map((pred, index) => (
            <div key={index} className="flex justify-between items-center bg-indigo-600/10 rounded-lg p-3 border border-indigo-500/30">
              <span className="text-sm">{pred.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-indigo-700/30 rounded-full h-2">
                  <div 
                    className="bg-indigo-400 h-2 rounded-full"
                    style={{ width: `${pred.confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium w-10">{(pred.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQualityMetrics = () => {
    if (!media.quality_metrics) return null;
    
    const metrics = media.quality_metrics;
    return (
      <div className="mb-6">
        <h4 className="font-semibold mb-3 text-orange-300 flex items-center gap-2">
          <span>📊</span>
          Métriques de Qualité
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <div className="text-lg">⚡</div>
            <p className="text-xs">Netteté</p>
            <p className="font-bold text-sm">{metrics.sharpness || 'N/A'}</p>
          </div>
          <div className="text-center p-3 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <div className="text-lg">💡</div>
            <p className="text-xs">Luminosité</p>
            <p className="font-bold text-sm">{metrics.brightness ? (metrics.brightness * 100).toFixed(0) : '0'}%</p>
          </div>
          <div className="text-center p-3 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <div className="text-lg">🎨</div>
            <p className="text-xs">Contraste</p>
            <p className="font-bold text-sm">{metrics.contrast ? (metrics.contrast * 100).toFixed(0) : '0'}%</p>
          </div>
          <div className="text-center p-3 bg-orange-600/20 rounded-lg border border-orange-500/30">
            <div className="text-lg">🔇</div>
            <p className="text-xs">Bruit</p>
            <p className="font-bold text-sm">{metrics.noise_level ? (metrics.noise_level * 100).toFixed(0) : '0'}%</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAIStats = () => {
    const models = media.ai_models_used ? (typeof media.ai_models_used === 'string' ? media.ai_models_used.split(',') : []) : ['Basic'];
    const analysisTime = media.uploaded_at ? new Date(media.uploaded_at).toLocaleString('fr-FR') : 'Inconnue';
    
    return (
      <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/10">
        <div className="flex flex-wrap justify-between items-center text-sm">
          <div className="mb-2 md:mb-0">
            <span className="font-semibold text-white/70">Modèles IA utilisés:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {models.map((model, index) => (
                <span key={index} className="px-2 py-1 bg-green-600/30 rounded text-xs border border-green-500/30">
                  {model.trim()}
                </span>
              ))}
            </div>
          </div>
          <div className="text-white/60">
            <span className="font-semibold">Analysé le:</span> {analysisTime}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🧠</span> 
        Analyse IA Avancée
        <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full">
          {media.ai_models_used?.split(',').length || 1} modèles
        </span>
      </h3>
      
      {/* Analysis Summary */}
      <div className="mb-6 p-4 bg-black/30 rounded-lg border border-white/10">
        <h4 className="font-semibold mb-2 text-purple-300">📊 Résumé de l'analyse</h4>
        <p className="text-white/80 text-sm leading-relaxed">
          {media.analysis_summary || "Analyse complète effectuée avec l'IA"}
        </p>
      </div>

      {/* AI Analysis Sections */}
      {renderSceneAnalysis()}
      {renderImageClassification()}
      {renderObjects()}
      {renderFaces()}
      {renderQualityMetrics()}
      {renderAudioAnalysis()}

      {/* AI Stats Footer */}
      {renderAIStats()}
    </div>
  );
}