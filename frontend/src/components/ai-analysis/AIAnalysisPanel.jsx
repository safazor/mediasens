import "./AIAnalysisPanel.css"

const AIAnalysisPanel = ({ analysis }) => {
  if (!analysis) return null

  return (
    <div className="ai-analysis-panel">
      <h2>AI Analysis Results</h2>

      {analysis.objects_detected && analysis.objects_detected.length > 0 && (
        <div className="analysis-section">
          <h3>Objects Detected</h3>
          <div className="objects-grid">
            {analysis.objects_detected.map((obj, idx) => (
              <div key={idx} className="object-item">
                <span className="object-name">{obj.name}</span>
                <span className="object-confidence">{(obj.confidence * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.faces_detected && analysis.faces_detected.length > 0 && (
        <div className="analysis-section">
          <h3>Faces & Emotions</h3>
          <div className="faces-grid">
            {analysis.faces_detected.map((face, idx) => (
              <div key={idx} className="face-item">
                <p>Face {idx + 1}</p>
                <p className="emotion">Emotion: {face.emotion}</p>
                <p className="confidence">Confidence: {(face.confidence * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.audio_analysis && (
        <div className="analysis-section">
          <h3>Audio Analysis</h3>
          <div className="audio-details">
            <p>Duration: {analysis.audio_analysis.duration?.toFixed(2)}s</p>
            <p>Tempo: {analysis.audio_analysis.tempo?.toFixed(1)} BPM</p>
            <p>Type: {analysis.audio_analysis.audio_type}</p>
            <p>Emotion: {analysis.audio_analysis.emotion}</p>
          </div>
        </div>
      )}

      {analysis.scene_context && (
        <div className="analysis-section">
          <h3>Scene Context</h3>
          <p>{analysis.scene_context}</p>
        </div>
      )}
    </div>
  )
}

export default AIAnalysisPanel
