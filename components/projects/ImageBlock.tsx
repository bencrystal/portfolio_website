import type { ContentSection } from '@/types/Project'
import Image from 'next/image'
import Link from 'next/link'

interface ImageBlockProps {
  /** Group of consecutive image items rendered together (1 = full width, 2+ = grid). */
  group: ContentSection[]
}

export const ImageBlock = ({ group }: ImageBlockProps) => {
  const isSingle = group.length === 1

  return (
    <div
      className={
        isSingle
          ? 'flex justify-center max-w-5xl mx-auto'
          : 'grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto'
      }
    >
      {group.map((img, i) => (
        <figure key={i} className="group">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-500/10">
            {img.url ? (
              <Link href={img.url} className="block relative group/link">
                <Image
                  src={img.content}
                  alt={img.caption || 'Project image'}
                  width={900}
                  height={500}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover/link:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 flex items-end justify-center p-8">
                  <span className="text-white font-medium bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm">
                    View Documentation
                  </span>
                </div>
              </Link>
            ) : (
              <Image
                src={img.content}
                alt={img.caption || 'Project image'}
                width={900}
                height={500}
                className="w-full h-auto object-cover"
              />
            )}
            {img.caption && (
              <figcaption className="p-8">
                <p className="text-base text-zinc-400 leading-relaxed whitespace-pre-wrap font-light">
                  {img.caption}
                </p>
              </figcaption>
            )}
          </div>
        </figure>
      ))}
    </div>
  )
}
