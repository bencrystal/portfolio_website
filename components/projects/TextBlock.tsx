import type { ContentSection } from '@/types/Project'
import { parseMarkdownLinks } from './parseMarkdownLinks'

export const TextBlock = ({ item }: { item: ContentSection }) => (
  <div className="max-w-4xl mx-auto space-y-8">
    <div className="text-xl leading-relaxed text-zinc-300 font-light whitespace-pre-wrap">
      {parseMarkdownLinks(item.content)}
    </div>
    {item.buttons && item.buttons.length > 0 && (
      <div className="flex flex-wrap gap-4 justify-center pt-6">
        {item.buttons.map((button, i) => (
          <a
            key={i}
            href={button.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center px-8 py-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-400/40 rounded-full text-blue-400 hover:text-blue-300 font-medium transition-all duration-300 ease-out backdrop-blur-sm"
          >
            {button.text}
            <svg
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        ))}
      </div>
    )}
  </div>
)
