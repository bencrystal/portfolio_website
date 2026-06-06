import type { ContentSection } from '@/types/Project'

const isLocalVideo = (url: string) => url.startsWith('/') || url.includes('.mp4')

const getYoutubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
  )
  return match ? match[1] : null
}

export const VideoBlock = ({ item }: { item: ContentSection }) => {
  const local = isLocalVideo(item.content)

  return (
    <div className="max-w-6xl mx-auto">
      {local ? (
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="w-full h-auto"
          >
            <source src={item.content} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {(item.title || item.caption) && (
            <div className="px-8 py-6">
              <p className="text-base text-zinc-400 font-medium leading-relaxed">
                {item.title || item.caption}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative pt-[56.25%] bg-zinc-900/40 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden shadow-2xl">
          {item.title && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-8 z-10">
              <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            </div>
          )}
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${getYoutubeId(item.content)}`}
            title={item.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  )
}
