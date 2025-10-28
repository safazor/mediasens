import "./AdvancedInsights.css"

const AdvancedInsights = ({ analysis }) => {
  if (!analysis) return null

  const getQualityColor = (score) => {
    if (score >= 80) return "#4ade80"
    if (score >= 60) return "#facc15"
    return "#ef4444"
  }

  return (
    <div className="advanced-insights">
      <h2>Advanced Insights</h2>

      <div className="insights-grid">
        {analysis.quality_score !== undefined && (
          <div className="insight-card">
            <h4>Quality Score</h4>
            <div className="quality-bar">
              <div
                className="quality-fill"
                style={{
                  width: `${analysis.quality_score}%`,
                  backgroundColor: getQualityColor(analysis.quality_score),
                }}
              />
            </div>
            <p>{analysis.quality_score.toFixed(1)}%</p>
          </div>
        )}

        {analysis.content_richness !== undefined && (
          <div className="insight-card">
            <h4>Content Richness</h4>
            <div className="richness-bar">
              <div
                className="richness-fill"
                style={{
                  width: `${analysis.content_richness * 100}%`,
                }}
              />
            </div>
            <p>{(analysis.content_richness * 100).toFixed(1)}%</p>
          </div>
        )}

        {analysis.emotional_content && (
          <div className="insight-card">
            <h4>Emotional Content</h4>
            <p className="emotion-text">{analysis.emotional_content}</p>
          </div>
        )}

        {analysis.scene_type && (
          <div className="insight-card">
            <h4>Scene Type</h4>
            <p className="scene-text">{analysis.scene_type}</p>
          </div>
        )}
      </div>

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="recommendations">
          <h3>AI Recommendations</h3>
          <ul>
            {analysis.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default AdvancedInsights
