'use client'

import { Button } from "@/components/ui/button"
import { ProjectSection } from "@/types/Project"

interface ProjectLayoutProps {
  title: string;
  subtitle?: string;
  sections: ProjectSection[];
  notionLink?: string;
}

export default function ProjectLayout({ title, subtitle, sections, notionLink }: ProjectLayoutsProps) {
  return (
    <main className='min-h-screen bg-gradient-to-b from-zinc-900 to-black text-zinc-200'>
      <div className='container mx-auto px-4 py-16 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-8 text-white'>{title}</h1>
        
        {subtitle && (
          <p className='text-xl text-zinc-300 mb-12'>{subtitle}</p>
        )}

        <section className="space-y-12">
          {sections.map((section, index) => (
            <div key={index}>
              {section.title && (
                <h3 className="text-2xl font-semibold mb-4 text-cyan-400">
                  {section.title}
                </h3>
              )}
              
              {section.content && (
                <p className="text-zinc-300 mb-4">{section.content}</p>
              )}

              {section.video && (
                <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
                  <iframe
                    src={`https://www.youtube.com/embed/${section.video}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              {section.images && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {section.images.map((img, i) => (
                    <div key={i} className="group">
                      <div className="rounded-lg overflow-hidden bg-zinc-800">
                        <div className="transform transition-all duration-300 group-hover:scale-105">
                          <img 
                            src={img.src}
                            alt={img.caption || "Project image"}
                            className="w-full h-auto"
                          />
                          {img.caption && (
                            <p className="text-sm text-zinc-400 p-3">{img.caption}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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