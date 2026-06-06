import type { ContentSection } from '@/types/Project'

export const FigmaBlock = ({ item }: { item: ContentSection }) => (
  <div className="max-w-7xl mx-auto">
    <div className="relative pt-[75%] bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      <iframe
        className="absolute top-0 left-0 w-full h-full"
        src={item.content}
        title="Figma Prototype"
        allowFullScreen
      />
    </div>
  </div>
)
