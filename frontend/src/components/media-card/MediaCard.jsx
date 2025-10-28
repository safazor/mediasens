// components/media-card/MediaCard.js
"use client"

import "./MediaCard.css"

const MediaCard = ({ media, onClick, onDelete }) => {
  const handleDeleteClick = (e) => {
    e.stopPropagation()
    onDelete()
  }

  const renderMediaPreview = () => {
    if (media.media_type === "image") {
      return (
        <img 
          src={media.file} 
          alt={media.theme || "Media"} 
          className="media-preview"
          onError={(e) => {
            e.target.src = "/placeholder.svg"
          }}
        />
      )
    } else if (media.media_type === "video") {
      return (
        <div className="video-preview">
          <video className="media-preview">
            <source src={media.file} type="video/mp4" />
          </video>
          <div className="video-overlay">🎥</div>
        </div>
      )
    } else if (media.media_type === "audio") {
      return (
        <div className="audio-preview">
          <div className="audio-icon">🎵</div>
          <p className="audio-text">Audio File</p>
        </div>
      )
    } else {
      return (
        <div className="unknown-preview">
          <div className="unknown-icon">📄</div>
          <p className="unknown-text">Unknown Type</p>
        </div>
      )
    }
  }

  return (
    <div className="media-card" onClick={onClick}>
      <div className="media-preview-container">
        {renderMediaPreview()}
      </div>
      
      <div className="media-info">
        <h3 className="media-theme">{media.theme || "Untitled"}</h3>
        <p className="media-type">Type: {media.media_type || "Unknown"}</p>
        <p className="media-quality">
          Quality: {media.quality_score ? `${(media.quality_score * 100).toFixed(0)}%` : "N/A"}
        </p>
        <p className="media-tags">
          Tags: {media.tags || "No tags"}
        </p>
        <div className="media-actions">
          <button 
            className="delete-button"
            onClick={handleDeleteClick}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default MediaCard