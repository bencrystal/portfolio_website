import { projects } from '@/data/projects';
import { notFound } from 'next/navigation';
import Background from '@/components/Background';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/types/Project';

export async function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  // Extract YouTube video ID from URL if it exists
  const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  // Function to get image sections within a specific items array
  const getImageGroupInSection = (items: typeof project.content, startIndex: number) => {
    if (!items) return [];
    let imageGroup = [];
    let currentIndex = startIndex;
    
    while (
      currentIndex < items.length && 
      items[currentIndex].type === 'image'
    ) {
      imageGroup.push(items[currentIndex]);
      currentIndex++;
    }
    return imageGroup;
  };

  return (
    <main className="min-h-screen bg-zinc-900 text-white relative">
      <Background 
        text={project.backgroundText} 
        fontSize={project.backgroundFontSize}
        spacing={project.backgroundSpacing}
      />
      
      <div className="relative z-30">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-8 pt-8 pb-24">
          <div className="max-w-4xl">
            {/* Project Categories */}
            {project.category && project.category.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {project.category.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg text-sm font-medium text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Project Title */}
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight">
              {project.title}
            </h1>

            {/* Project Description */}
            <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed mb-12 max-w-3xl">
              {project.description}
            </p>

            {/* Project Meta */}
            <div className="flex flex-wrap items-center gap-8 text-zinc-400 mb-16">
              <div>
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Timeline</span>
                <p className="text-lg text-zinc-300 mt-1">
                  {project.startDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })} - {
                    project.endDate ? project.endDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'Present'
                  }
                </p>
              </div>
              
              {/* Tech Stack Preview */}
              <div>
                <span className="text-sm font-medium text-zinc-500 uppercase tracking-wide">Technologies</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {project.techStack.slice(0, 3).map((tech) => (
                    <span 
                      key={tech.name}
                      className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm font-medium"
                      style={{ color: tech.color || '#d4d4d8' }}
                    >
                      {tech.name}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm font-medium text-zinc-400">
                      +{project.techStack.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-4">
              {project.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-200 ease-out font-medium"
                >
                  {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Content Sections */}
        {project.content && project.content.length > 0 && (
          <section className="max-w-6xl mx-auto px-8 pb-24">
            <div className="space-y-12">
              {(() => {
                // Group content by sections (title + following content)
                const sections: Array<{ title?: string; items: typeof project.content }> = [];
                let currentSection: { title?: string; items: typeof project.content } = { items: [] };
                
                project.content.forEach((item, index) => {
                  if (item.title) {
                    // Start a new section
                    if (currentSection.items.length > 0) {
                      sections.push(currentSection);
                    }
                    currentSection = { title: item.title, items: [item] };
                  } else {
                    // Add to current section
                    currentSection.items.push(item);
                  }
                });
                
                // Don't forget the last section
                if (currentSection.items.length > 0) {
                  sections.push(currentSection);
                }
                
                return sections.map((section, sectionIndex) => (
                  <article key={sectionIndex} className="max-w-4xl mx-auto">
                    <div className="bg-zinc-800/70 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                      {section.title && (
                        <header className="mb-8">
                          {section.items[0]?.url ? (
                            <Link 
                              href={section.items[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group"
                            >
                              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight group-hover:text-cyan-400 transition-colors duration-200 whitespace-pre-line">
                                {section.title}
                              </h2>
                            </Link>
                          ) : (
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight whitespace-pre-line">
                              {section.title}
                            </h2>
                          )}
                        </header>
                      )}
                      
                      <div className="space-y-8">
                        {section.items.map((item, itemIndex) => {
                          // Skip rendering if this is a subsequent image in a group
                          if (item.type === 'image' && itemIndex > 0 && section.items[itemIndex - 1]?.type === 'image') {
                            return null;
                          }

                          return (
                            <div key={itemIndex}>
                              {item.type === 'text' && (
                                <div className="text-lg text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                  {item.content}
                                </div>
                              )}

                              {item.type === 'video' && (
                                <div className="relative pt-[56.25%] bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                                  <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${getYoutubeId(item.content)}`}
                                    title="Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}

                              {item.type === 'figma' && (
                                <div className="relative pt-[75%] bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                                  <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={item.content}
                                    title="Figma Prototype"
                                    allowFullScreen
                                  />
                                </div>
                              )}

                              {item.type === 'image' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                  {getImageGroupInSection(section.items, itemIndex).map((imgSection, i) => (
                                    <figure key={i} className="group h-full">
                                      <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col">
                                        <div className="relative flex-shrink-0">
                                          {imgSection.url ? (
                                            <Link 
                                              href={imgSection.url}
                                              className="block relative group/link"
                                            >
                                              <Image 
                                                src={imgSection.content}
                                                alt={imgSection.caption || "Project image"}
                                                width={800}
                                                height={450}
                                                className="w-full h-auto object-cover transition-transform duration-500 group-hover/link:scale-105"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                  View Documentation
                                                </span>
                                              </div>
                                            </Link>
                                          ) : (
                                            <Image 
                                              src={imgSection.content}
                                              alt={imgSection.caption || "Project image"}
                                              width={800}
                                              height={450}
                                              className="w-full h-auto object-cover"
                                            />
                                          )}
                                        </div>
                                        {imgSection.caption && (
                                          <figcaption className="p-6 flex-grow flex items-end">
                                            <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                              {imgSection.caption}
                                            </p>
                                          </figcaption>
                                        )}
                                      </div>
                                    </figure>
                                  ))}
                                </div>
                              )}

                              {item.type === 'download' && item.url && (
                                <div className="bg-cyan-500/10 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-8">
                                  <div className="flex items-center gap-4">
                                    <div className="text-3xl">🎮</div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                      <a 
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                                      >
                                        {item.content}
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </article>
                ));
              })()}
            </div>
          </section>
        )}

        {/* Project Details Sidebar */}
        <section className="max-w-6xl mx-auto px-8 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Key Features */}
            {project.highlights && project.highlights.length > 0 && (
              <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-6 text-white">Key Features</h3>
                <ul className="space-y-4">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-zinc-300 leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Tech Stack */}
            <div className="bg-zinc-950/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-white">Tech Stack</h3>
              <div className="grid grid-cols-2 gap-3">
                {project.techStack.map((tech) => (
                  <div
                    key={tech.name}
                    className="px-4 py-3 bg-zinc-800/50 rounded-lg text-sm font-medium text-center"
                    style={{ color: tech.color || '#d4d4d8' }}
                  >
                    {tech.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
} 