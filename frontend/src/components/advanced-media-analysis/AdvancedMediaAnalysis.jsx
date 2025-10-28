// components/AdvancedMediaAnalysis.js
import {React, useEffect} from 'react';

export default function AdvancedMediaAnalysis({ media }) {

    useEffect(() => {
        console.log("hello",media)
    },[])
  const renderObjects = () => {
    if (!media.objects_detected || media.objects_detected.length === 0) return null;
    
    const getBboxString = (bbox) => {
      if (!bbox) return 'N/A';
      if (Array.isArray(bbox)) {
        return bbox.join(', ');
      }
      if (typeof bbox === 'object') {
        // Handle object format like {x1, y1, x2, y2}
        if (bbox.x1 !== undefined) {
          return `${bbox.x1},${bbox.y1},${bbox.x2},${bbox.y2}`;
        }
        // Handle other object formats
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

    return (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-green-300 flex items-center">
          <span className="mr-2">🎯</span>
          Objets détectés ({media.ai_models_used?.includes('YOLOv8') ? 'YOLOv8' : 'OpenCV'})
        </h4>
        <div className="flex flex-wrap gap-2">
          {media.objects_detected.slice(0, 10).map((obj, index) => (
            <span 
              key={index} 
              className="px-3 py-1 bg-green-600/30 rounded-full text-sm border border-green-500/30"
              title={`Confiance: ${(obj.confidence * 100).toFixed(1)}% | Position: ${getBboxString(obj.bbox)}`}
            >
              {getLabel(obj)} ({(obj.confidence * 100).toFixed(0)}%)
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderFaces = () => {
    if (!media.faces_detected || media.faces_detected.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-blue-300 flex items-center">
          <span className="mr-2">😊</span>
          Analyse des visages (OpenCV)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {media.faces_detected.slice(0, 3).map((face, index) => (
            <div key={index} className="bg-blue-600/20 rounded-lg p-3 border border-blue-500/30">
              <div className="flex justify-between text-sm">
                <span>Âge: {face.age || 'Inconnu'}</span>
                <span>Genre: {face.gender || 'Inconnu'}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Émotion: {face.emotion || 'Neutre'}</span>
                <span>Confiance: {face.confidence ? (face.confidence * 100).toFixed(0) : '0'}%</span>
              </div>
              {face.region && (
                <div className="text-xs text-white/60 mt-1">
                  Position: {face.region.x || 0},{face.region.y || 0}
                </div>
              )}
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
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-yellow-300 flex items-center">
          <span className="mr-2">📊</span>
          Métriques de qualité
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
            <div className="text-lg">⚡</div>
            <p className="text-xs">Netteté</p>
            <p className="font-bold text-sm">{metrics.sharpness || 'N/A'}</p>
          </div>
          <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
            <div className="text-lg">💡</div>
            <p className="text-xs">Luminosité</p>
            <p className="font-bold text-sm">{metrics.brightness ? (metrics.brightness * 100).toFixed(0) : '0'}%</p>
          </div>
          <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
            <div className="text-lg">🎨</div>
            <p className="text-xs">Contraste</p>
            <p className="font-bold text-sm">{metrics.contrast ? (metrics.contrast * 100).toFixed(0) : '0'}%</p>
          </div>
          <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
            <div className="text-lg">🔇</div>
            <p className="text-xs">Bruit</p>
            <p className="font-bold text-sm">{metrics.noise_level ? (metrics.noise_level * 100).toFixed(0) : '0'}%</p>
          </div>
        </div>
        {metrics.resolution && (
          <div className="mt-2 text-center text-sm text-white/60">
            Résolution: {metrics.resolution} • Composition: {metrics.composition_score ? (metrics.composition_score * 100).toFixed(0) : '0'}%
          </div>
        )}
      </div>
    );
  };

  const renderColorAnalysis = () => {
    if (!media.color_analysis) return null;
    
    const colors = media.color_analysis;
    return (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-purple-300 flex items-center">
          <span className="mr-2">🎨</span>
          Analyse des couleurs
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          <div className="text-center p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <div className="text-lg">🌈</div>
            <p className="text-xs">Teinte dominante</p>
            <p className="font-bold text-sm">{colors.dominant_hue || 'N/A'}°</p>
          </div>
          <div className="text-center p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <div className="text-lg">🎭</div>
            <p className="text-xs">Saturation</p>
            <p className="font-bold text-sm">{colors.saturation ? colors.saturation.toFixed(1) : 'N/A'}</p>
          </div>
          <div className="text-center p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <div className="text-lg">💎</div>
            <p className="text-xs">Vivacité</p>
            <p className="font-bold text-sm">{colors.colorfulness ? colors.colorfulness.toFixed(1) : 'N/A'}</p>
          </div>
        </div>
        
        {/* Color Palette */}
        {colors.color_palette && colors.color_palette.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-white/70 mb-2">Palette de couleurs dominantes:</p>
            <div className="flex gap-2 justify-center">
              {colors.color_palette.slice(0, 5).map((color, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 h-8 rounded-full border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                  <span className="text-xs text-white/60 mt-1">{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTechnicalMetadata = () => {
    if (!media.technical_metadata) return null;
    
    const tech = media.technical_metadata;
    return (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-gray-300 flex items-center">
          <span className="mr-2">🔧</span>
          Métadonnées techniques
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tech.dimensions && (
            <div className="text-center p-3 bg-gray-600/20 rounded-lg border border-gray-500/30">
              <div className="text-lg">📐</div>
              <p className="text-xs">Dimensions</p>
              <p className="font-bold text-sm">{tech.dimensions}</p>
            </div>
          )}
          {tech.channels && (
            <div className="text-center p-3 bg-gray-600/20 rounded-lg border border-gray-500/30">
              <div className="text-lg">🎞️</div>
              <p className="text-xs">Canaux</p>
              <p className="font-bold text-sm">{tech.channels}</p>
            </div>
          )}
          {tech.aspect_ratio && (
            <div className="text-center p-3 bg-gray-600/20 rounded-lg border border-gray-500/30">
              <div className="text-lg">⎈</div>
              <p className="text-xs">Ratio</p>
              <p className="font-bold text-sm">{tech.aspect_ratio}:1</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAudioAnalysis = () => {
    if (!media.audio_analysis || Object.keys(media.audio_analysis).length === 0) return null;
    
    return (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-yellow-300 flex items-center">
          <span className="mr-2">🎵</span>
          Analyse audio avancée
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {media.audio_analysis.tempo && (
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">🎶</div>
              <p className="text-xs">Tempo</p>
              <p className="font-bold text-sm">{media.audio_analysis.tempo.toFixed(0)} BPM</p>
            </div>
          )}
          {media.audio_analysis.duration_seconds && (
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">⏱️</div>
              <p className="text-xs">Durée</p>
              <p className="font-bold text-sm">{media.audio_analysis.duration_seconds.toFixed(1)}s</p>
            </div>
          )}
          {media.audio_analysis.rms_energy && (
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">🔊</div>
              <p className="text-xs">Énergie</p>
              <p className="font-bold text-sm">{media.audio_analysis.rms_energy.toFixed(2)}</p>
            </div>
          )}
          {media.audio_analysis.spectral_centroid && (
            <div className="text-center p-3 bg-yellow-600/20 rounded-lg border border-yellow-500/30">
              <div className="text-lg">📊</div>
              <p className="text-xs">Centroïde</p>
              <p className="font-bold text-sm">{media.audio_analysis.spectral_centroid.toFixed(0)}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAIStats = () => {
    const models = media.ai_models_used ? (typeof media.ai_models_used === 'string' ? media.ai_models_used.split(',') : []) : ['Basic'];
    const analysisTime = media.uploaded_at ? new Date(media.uploaded_at).toLocaleString('fr-FR') : 'Inconnue';
    
    return (
      <div className="mt-4 p-3 bg-black/40 rounded border border-white/10">
        <div className="flex flex-wrap justify-between items-center text-xs text-white/60">
          {/* <div>
            <span className="font-semibold">Modèles IA utilisés:</span>{' '}
            {models.join(', ')}
          </div> */}
          <div>
            <span className="font-semibold">Analysé le:</span> {analysisTime}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl border border-purple-500/30">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🧠</span> 
        Analyse IA Avancée
        <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded-full">
          {media.ai_models_used || 'AI Analysis'}
        </span>
      </h3>
      
      {/* Analysis Summary */}
      <div className="mb-4 p-4 bg-black/30 rounded-lg border border-white/10">
        <h4 className="font-semibold mb-2 text-purple-300">📊 Résumé de l'analyse</h4>
        <p className="text-white/80 text-sm">{media.analysis_summary || "Analyse complète effectuée"}</p>
      </div>

      {/* AI Analysis Sections */}
      {renderObjects()}
      {renderFaces()}
      {renderQualityMetrics()}
      {renderColorAnalysis()}
      {renderTechnicalMetadata()}
      {renderAudioAnalysis()}

      {/* Scene Context */}
      {media.scene_context && media.scene_context !== 'General' && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2 text-purple-300">🏞️ Contexte de scène</h4>
          <span className="px-3 py-1 bg-purple-600/30 rounded-full text-sm">
            {media.scene_context}
          </span>
        </div>
      )}

      {/* Quality Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div className="text-center p-3 bg-purple-600/20 rounded-lg border border-purple-500/30">
          <div className="text-xl">⭐</div>
          <p className="text-xs">Qualité IA</p>
          <p className="font-bold">{(media.quality_score * 100).toFixed(0)}%</p>
        </div>
        <div className="text-center p-3 bg-blue-600/20 rounded-lg border border-blue-500/30">
          <div className="text-xl">🎨</div>
          <p className="text-xs">Thème</p>
          <p className="font-bold text-sm">{media.theme}</p>
        </div>
        <div className="text-center p-3 bg-green-600/20 rounded-lg border border-green-500/30">
          <div className="text-xl">🏷️</div>
          <p className="text-xs">Tags</p>
          <p className="font-bold text-sm">{media.tags?.split(',').length || 0}</p>
        </div>
        <div className="text-center p-3 bg-red-600/20 rounded-lg border border-red-500/30">
          <div className="text-xl">🤖</div>
          <p className="text-xs">Modèles IA</p>
          <p className="font-bold text-sm">{media.ai_models_used || 1}</p>
        </div>
      </div>

      {/* AI Stats Footer */}
      {renderAIStats()}
    </div>
  );
}