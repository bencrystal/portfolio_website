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

  // Function to parse markdown links and return JSX
  const parseMarkdownLinks = (text: string) => {
    const parts = text.split(/(\[([^\]]+)\]\(([^)]+)\))/g);
    
    return parts.map((part, index) => {
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, linkText, url] = linkMatch;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30 hover:decoration-blue-300/50 underline-offset-4 transition-all duration-300 font-medium"
          >
            {linkText}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative">
      <Background 
        text={project.backgroundText} 
        fontSize={project.backgroundFontSize}
        spacing={project.backgroundSpacing}
      />
      
      <div className="relative z-30">
        {/* Apple-style Navigation */}
        <nav className="max-w-7xl mx-auto px-6 pt-6 pb-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link 
              href="/" 
              className="text-zinc-400 hover:text-white transition-colors duration-200"
            >
              Portfolio
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-white">{project.title}</span>
          </div>
        </nav>

        {/* Refined Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-32">
          <div className="max-w-4xl">
            {/* Project Categories - More refined */}
            {project.category && project.category.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-12">
                {project.category.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-4 py-2 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] rounded-full text-sm font-medium text-zinc-300 hover:bg-white/[0.12] transition-colors duration-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Project Title - Apple typography */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold mb-8 text-white tracking-tight leading-[0.9] bg-gradient-to-b from-white to-zinc-300 text-transparent bg-clip-text">
              {project.title}
            </h1>

            {/* Project Description - More elegant */}
            <p className="text-2xl md:text-3xl text-zinc-400 leading-relaxed mb-16 max-w-4xl font-light">
              {project.description}
            </p>

            {/* Project Meta - Clean layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Timeline</h3>
                <p className="text-xl text-zinc-200 font-light">
                  {project.startDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })} — {
                    project.endDate ? project.endDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'Present'
                  }
                </p>
              </div>
              
              {/* Tech Stack Preview - Cleaner design */}
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Key Technologies</h3>
                <div className="flex flex-wrap gap-3">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <span 
                      key={tech.name}
                      className="px-4 py-2 bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/50 rounded-full text-sm font-medium text-zinc-300"
                    >
                      {tech.name}
                    </span>
                  ))}
                  {project.techStack.length > 4 && (
                    <span className="px-4 py-2 bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/50 rounded-full text-sm font-medium text-zinc-400">
                      +{project.techStack.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links - Apple button style */}
            {project.links && project.links.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {project.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative px-8 py-3 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.2] rounded-full font-medium transition-all duration-300 ease-out"
                  >
                    <span className="relative z-10">
                      {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Content Sections - Improved spacing and flow */}
        {project.content && project.content.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 pb-32">
            <div className="space-y-20">
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
                  <article key={sectionIndex} className="max-w-5xl mx-auto">
                    {/* Remove background panel for cleaner Apple look */}
                    <div className="space-y-12">
                      {section.title && (
                        <header className="text-center pb-8">
                          {section.items[0]?.url ? (
                            <Link 
                              href={section.items[0].url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-block"
                            >
                              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight group-hover:text-cyan-300 transition-colors duration-300 whitespace-pre-line">
                                {section.title}
                              </h2>
                              <div className="w-20 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-4" />
                            </Link>
                          ) : (
                            <>
                              <h2 className="text-4xl md:text-5xl font-semibold text-white tracking-tight whitespace-pre-line">
                                {section.title}
                              </h2>
                              <div className="w-20 h-px bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent mx-auto mt-4" />
                            </>
                          )}
                        </header>
                      )}
                      
                      <div className="space-y-16">
                        {section.items.map((item, itemIndex) => {
                          // Skip rendering if this is a subsequent image in a group
                          if (item.type === 'image' && itemIndex > 0 && section.items[itemIndex - 1]?.type === 'image') {
                            return null;
                          }

                          return (
                            <div key={itemIndex}>
                              {item.type === 'text' && (
                                <div className="max-w-4xl mx-auto space-y-8">
                                  <div className="text-xl leading-relaxed text-zinc-300 font-light whitespace-pre-wrap">
                                    {parseMarkdownLinks(item.content)}
                                  </div>
                                  {item.buttons && item.buttons.length > 0 && (
                                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                                      {item.buttons.map((button, buttonIndex) => (
                                        <a
                                          key={buttonIndex}
                                          href={button.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="group inline-flex items-center px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-400/40 rounded-full text-blue-400 hover:text-blue-300 font-medium transition-all duration-300 ease-out backdrop-blur-sm"
                                        >
                                          {button.text}
                                          <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {item.type === 'video' && (
                                <div className="max-w-5xl mx-auto">
                                  <div className="relative pt-[56.25%] bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                    <iframe
                                      className="absolute top-0 left-0 w-full h-full"
                                      src={`https://www.youtube.com/embed/${getYoutubeId(item.content)}`}
                                      title="Video"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}

                              {item.type === 'figma' && (
                                <div className="max-w-6xl mx-auto">
                                  <div className="relative pt-[75%] bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                                    <iframe
                                      className="absolute top-0 left-0 w-full h-full"
                                      src={item.content}
                                      title="Figma Prototype"
                                      allowFullScreen
                                    />
                                  </div>
                                </div>
                              )}

                              {item.type === 'image' && (
                                (() => {
                                  const imageGroup = getImageGroupInSection(section.items, itemIndex);
                                  const isSingleImage = imageGroup.length === 1;
                                  
                                  return (
                                    <div className={
                                      isSingleImage 
                                        ? "flex justify-center max-w-4xl mx-auto" 
                                        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-6xl mx-auto"
                                    }>
                                      {imageGroup.map((imgSection, i) => (
                                        <figure key={i} className="group">
                                          <div className={`bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:border-white/20 hover:shadow-2xl hover:shadow-cyan-500/10 ${
                                            isSingleImage ? "max-w-2xl" : ""
                                          }`}>
                                            <div className="relative">
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
                                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover/link:scale-105"
                                                  />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                                                    <span className="text-white font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
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
                                              <figcaption className="p-6">
                                                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                                  {imgSection.caption}
                                                </p>
                                              </figcaption>
                                            )}
                                          </div>
                                        </figure>
                                      ))}
                                    </div>
                                  );
                                })()
                              )}

                              {item.type === 'download' && item.url && (
                                <div className="max-w-3xl mx-auto">
                                  <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 text-center">
                                    <div className="text-4xl mb-4">🎮</div>
                                    <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                                    <a 
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-8 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 hover:border-cyan-300/50 rounded-full text-cyan-300 hover:text-cyan-200 font-medium transition-all duration-300"
                                    >
                                      {item.content}
                                    </a>
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

        {/* Project Details - Refined sidebar */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Key Features */}
            {project.highlights && project.highlights.length > 0 && (
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
                <h3 className="text-3xl font-semibold mb-8 text-white">Key Features</h3>
                <ul className="space-y-6">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-3 flex-shrink-0" />
                      <span className="text-lg text-zinc-300 leading-relaxed font-light">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete Tech Stack */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10">
              <h3 className="text-3xl font-semibold mb-8 text-white">Technologies</h3>
              <div className="grid grid-cols-1 gap-3">
                {project.techStack.map((tech) => (
                  <div
                    key={tech.name}
                    className="px-5 py-4 bg-zinc-800/40 border border-zinc-700/30 rounded-2xl text-base font-medium text-zinc-200 transition-colors duration-300 hover:bg-zinc-800/60"
                  >
                    {tech.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Back to Portfolio - Apple style */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="text-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.2] rounded-full font-medium transition-all duration-300 ease-out"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Portfolio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
} 