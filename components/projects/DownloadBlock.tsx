import type { ContentSection } from '@/types/Project'

export const DownloadBlock = ({ item }: { item: ContentSection }) => {
  if (!item.url) return null

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-10 text-center">
        <div className="text-5xl mb-6">🎮</div>
        {item.title && (
          <h3 className="text-3xl font-semibold text-white mb-6">{item.title}</h3>
        )}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-10 py-4 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 hover:border-cyan-300/50 rounded-full text-cyan-300 hover:text-cyan-200 font-medium transition-all duration-300 text-lg"
        >
          {item.content}
        </a>
      </div>
    </div>
  )
}
