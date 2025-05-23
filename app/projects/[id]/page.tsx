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

  const demoVideo = project.links.find(link => link.type === "demo");
  const youtubeId = demoVideo ? getYoutubeId(demoVideo.url) : null;

  // Function to get image sections
  const getImageGroup = (content: Project['content'], startIndex: number) => {
    if (!content) return [];
    let imageGroup = [];
    let currentIndex = startIndex;
    
    while (
      currentIndex < content.length && 
      content[currentIndex].type === 'image'
    ) {
      imageGroup.push(content[currentIndex]);
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
      <div className="relative z-30 max-w-4xl mx-auto p-8">
        <h1 className="text-5xl font-bold mb-8">{project.title}</h1>

        {/* Tags Section */}
        {project.category && project.category.length > 0 && (
          <div className="flex gap-2 mb-6">
            {project.category.map((tag) => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-zinc-800 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Timeframe */}
        <div className="text-zinc-400 mb-8">
          {project.startDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })} - {
            project.endDate ? project.endDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            }) : 'Present'
          }
        </div>

        {/* Content Sections */}
        {project.content && project.content.length > 0 && (
          <div className="space-y-8">
            {project.content.map((section, index) => (
              <div key={index} className={`${section.title ? 'bg-zinc-800/75 rounded-lg p-6' : ''}`}>
                {section.title && (
                  <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
                )}
                
                {section.type === 'text' && (
                  <p className="text-zinc-300 whitespace-pre-wrap">{section.content}</p>
                )}

                {section.type === 'video' && (
                  <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${getYoutubeId(section.content)}`}
                      title="Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {section.type === 'figma' && (
                  <div className="relative pt-[75%] bg-zinc-800 rounded-lg overflow-hidden">
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={section.content}
                      title="Figma Prototype"
                      allowFullScreen
                    />
                  </div>
                )}

                {section.type === 'image' && (
                  <div className="mb-4">
                    {index > 0 && project.content?.[index - 1]?.type === 'image' ? (
                      null
                    ) : (
                      <div className="p-4 -m-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:auto-rows-fr">
                          {getImageGroup(project.content, index).map((imgSection, i) => (
                            <div key={i} className="group md:h-full">
                              <div className="rounded-lg overflow-hidden bg-zinc-800/75 flex flex-col md:h-full">
                                <div className="flex items-start justify-center">
                                  {imgSection.url ? (
                                    <Link 
                                      href={imgSection.url}
                                      className="relative group cursor-pointer"
                                    >
                                      <Image 
                                        src={imgSection.content}
                                        alt={imgSection.caption || "Project image"}
                                        width={800}
                                        height={450}
                                        className="max-w-full max-h-full object-contain transition-opacity group-hover:opacity-30"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                        <span className="text-white text-lg font-semibold">
                                          Click to view full documentation
                                        </span>
                                      </div>
                                    </Link>
                                  ) : (
                                    <Image 
                                      src={imgSection.content}
                                      alt={imgSection.caption || "Project image"}
                                      width={800}
                                      height={450}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  )}
                                </div>
                                {imgSection.caption && (
                                  <p className="text-sm text-zinc-300 p-3 flex-shrink-0 whitespace-pre-wrap">{imgSection.caption}</p>
                                )}
                                <div className="md:flex-grow"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {section.type === 'download' && section.url && (
                  <div className="bg-cyan-500/10 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🎮</div>
                      <a 
                        href={section.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {section.content}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Key Features */}
        {project.highlights && project.highlights.length > 0 && (
          <div className="bg-zinc-800/75 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              {project.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tech Stack */}
        <div className="bg-zinc-800/75 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span 
                key={tech.name}
                className="px-3 py-1 bg-zinc-700 rounded-full text-sm"
                style={{ color: tech.color }}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="bg-zinc-800/75 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Links</h2>
          <div className="space-y-2">
            {project.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors"
              >
                {link.type.charAt(0).toUpperCase() + link.type.slice(1)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 