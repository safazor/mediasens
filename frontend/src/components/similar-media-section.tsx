"use client"

import { useRouter } from "next/navigation"

export default function SimilarMediaSection({ media }) {
  const router = useRouter()

  if (!media || media.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/60">
        No similar media found in your library.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {media.map((item) => (
        <div
          key={item.id}
          onClick={() => router.push(`/media/${item.id}`)}
          className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer flex gap-4"
        >
          <div className="w-20 h-20 bg-black/40 rounded-lg flex-shrink-0 flex items-center justify-center">
            {item.media_type === "image" && item.file ? (
              <img
                src={item.file || "/placeholder.svg"}
                alt={item.theme}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-2xl">
                {item.media_type === "video" ? "🎬" : item.media_type === "audio" ? "🎵" : "📄"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-white">{item.theme}</h4>
            <p className="text-xs text-white/60 mb-2">{item.media_type?.toUpperCase()}</p>
            <div className="flex gap-2">
              <span className="text-xs px-2 py-1 bg-purple-600/30 rounded text-purple-200">
                {(item.quality_score * 100).toFixed(0)}% quality
              </span>
              {item.tags && (
                <span className="text-xs px-2 py-1 bg-blue-600/30 rounded text-blue-200">
                  {item.tags.split(",")[0].trim()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
