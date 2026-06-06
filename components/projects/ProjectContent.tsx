import Link from 'next/link'
import type { ContentSection } from '@/types/Project'
import { TextBlock } from './TextBlock'
import { VideoBlock } from './VideoBlock'
import { ImageBlock } from './ImageBlock'
import { FigmaBlock } from './FigmaBlock'
import { DownloadBlock } from './DownloadBlock'

interface Section {
  title?: string
  titleUrl?: string
  items: ContentSection[]
}

/**
 * Groups content items into sections (a section starts on each item with a title).
 */
const groupIntoSections = (content: ContentSection[]): Section[] => {
  const sections: Section[] = []
  let current: Section = { items: [] }

  for (const item of content) {
    if (item.title) {
      if (current.items.length > 0) sections.push(current)
      current = { title: item.title, titleUrl: item.url, items: [item] }
    } else {
      current.items.push(item)
    }
  }
  if (current.items.length > 0) sections.push(current)
  return sections
}

/**
 * Splits a section's items into "runs". Consecutive images become a single
 * ImageBlock run; every other item is its own single-element run.
 */
const splitIntoRuns = (items: ContentSection[]): ContentSection[][] => {
  const runs: ContentSection[][] = []
  let i = 0
  while (i < items.length) {
    if (items[i].type === 'image') {
      const group: ContentSection[] = []
      while (i < items.length && items[i].type === 'image') {
        group.push(items[i])
        i++
      }
      runs.push(group)
    } else {
      runs.push([items[i]])
      i++
    }
  }
  return runs
}

const renderRun = (run: ContentSection[], key: number) => {
  if (run.length > 1 || run[0].type === 'image') {
    return <ImageBlock key={key} group={run} />
  }
  const item = run[0]
  switch (item.type) {
    case 'text':
      return <TextBlock key={key} item={item} />
    case 'video':
      return <VideoBlock key={key} item={item} />
    case 'figma':
      return <FigmaBlock key={key} item={item} />
    case 'download':
      return <DownloadBlock key={key} item={item} />
    default:
      return null
  }
}

const SectionHeading = ({ title, url }: { title: string; url?: string }) => {
  const heading = (
    <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight whitespace-pre-line group-hover:text-cyan-300 transition-colors duration-300">
      {title}
    </h2>
  )
  const divider = (
    <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-6" />
  )

  return (
    <header className="text-center pb-12">
      {url ? (
        <Link href={url} target="_blank" rel="noopener noreferrer" className="group inline-block">
          {heading}
          {divider}
        </Link>
      ) : (
        <>
          {heading}
          {divider}
        </>
      )}
    </header>
  )
}

export const ProjectContent = ({ content }: { content: ContentSection[] }) => {
  const sections = groupIntoSections(content)

  return (
    <section className="max-w-7xl mx-auto px-6 pb-32">
      <div className="space-y-24">
        {sections.map((section, si) => {
          const runs = splitIntoRuns(section.items)
          return (
            <article key={si} className="max-w-6xl mx-auto">
              <div className="space-y-16">
                {section.title && (
                  <SectionHeading title={section.title} url={section.titleUrl} />
                )}
                <div className="space-y-20">
                  {runs.map((run, ri) => renderRun(run, ri))}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
