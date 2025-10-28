export default function SimilarMediaSection({ media, allMedia }) {
  const findSimilarMedia = () => {
    return allMedia.filter((m) => m.id !== media.id && m.theme === media.theme).slice(0, 4)
  }

  const similarMedia = findSimilarMedia()

  if (similarMedia.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-pink-900/20 to-rose-900/20 rounded-2xl border border-pink-500/30 p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <span className="mr-2">🔗</span>
        Médias Similaires
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {similarMedia.map((item) => (
          <div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-pink-500/50 transition"
          >
            <div className="aspect-square bg-black/30 flex items-center justify-center">
              {item.file.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={item.file || "/placeholder.svg"} alt="similar" className="object-cover w-full h-full" />
              ) : (
                <span className="text-2xl">📄</span>
              )}
            </div>
            <div className="p-2">
              <p className="text-xs text-white/60 truncate">{item.file.split("/").pop()}</p>
              <p className="text-xs font-semibold text-white/80">{item.theme}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
