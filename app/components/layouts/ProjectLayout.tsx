'use client'

import { Button } from "@/components/ui/button"
import type { ContentSection } from "@/types/Project"
import Image from 'next/image'

interface ProjectLayoutProps {
  title: string;
  subtitle?: string;
  sections: ContentSection[];
  notionLink?: string;
}

export default function ProjectLayout({ title, subtitle, sections, notionLink }: ProjectLayoutProps) {
  return (
    <main className='min-h-screen bg-gradient-to-b from-zinc-900 to-black text-zinc-200'>
      <div className='container mx-auto px-4 py-16 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-8 text-white'>{title}</h1>
        
        {subtitle && (
          <p className='text-xl text-zinc-300 mb-12'>{subtitle}</p>
        )}

        <section className="space-y-12">
          {sections.map((section: ContentSection, index: number) => (
            <div key={index}>
              {section.title && (
                <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
                  {section.title}
                </h3>
              )}
              
              {section.content && (
                <p className="text-zinc-300 mb-4">{section.content}</p>
              )}

              {section.type === 'video' && (
                <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
                  <iframe
                    src={`https://www.youtube.com/embed/${section.content}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              {section.type === 'image' && section.content && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="group">
                    <div className="rounded-lg overflow-hidden bg-zinc-800">
                      <div className="transform transition-all duration-300 group-hover:scale-105">
                        <Image 
                          src={section.content}
                          alt={section.caption || "Project image"}
                          width={800}
                          height={450}
                          className="w-full h-auto"
                        />
                        {section.caption && (
                          <p className="text-sm text-zinc-400 p-3">{section.caption}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        <Button 
          variant="outline" 
          className="mt-8 hover:bg-blue-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
          onClick={() => window.history.back()}
        >
          Back to Projects
        </Button>
      </div>
    </main>
  )
} 