import { projects } from '@/data/projects';
import { notFound } from 'next/navigation';
import Background from '@/components/Background';

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
        {project.content && (
          <div className="space-y-12">
            {project.content.map((section, index) => (
              <div key={index} className="mb-12">
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

                {section.type === 'image' && (
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    {/* Check if this is the start of an image group and hasn't been rendered yet */}
                    {index > 0 && 
                     project.content[index - 1]?.type === 'text' && 
                     project.content[index + 1]?.type === 'image' ? (
                      <div className="image-grid">
                        {(() => {
                          // Find the end of this image group
                          let endIndex = index;
                          while (
                            endIndex < project.content.length && 
                            project.content[endIndex].type === 'image'
                          ) {
                            endIndex++;
                          }
                          
                          // Render only this group of images
                          return project.content
                            .slice(index, endIndex)
                            .map((imgSection, i) => (
                              <div key={i} className="group">
                                <div className="rounded-lg overflow-hidden">
                                  <img 
                                    src={imgSection.content}
                                    alt={imgSection.caption || "Project image"}
                                    className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                                  />
                                </div>
                                {imgSection.caption && (
                                  <p className="text-sm text-zinc-400 mt-2">{imgSection.caption}</p>
                                )}
                              </div>
                            ));
                        })()}
                      </div>
                    ) : (
                      // Only render single images if they're not part of a group
                      !project.content[index - 1]?.type === 'image' && (
                        <div className="group">
                          <div className="rounded-lg overflow-hidden">
                            <img 
                              src={section.content}
                              alt={section.caption || "Project image"}
                              className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          {section.caption && (
                            <p className="text-sm text-zinc-400 mt-2">{section.caption}</p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

                {section.type === 'download' && (
                  <div className="bg-cyan-500/10 rounded-lg p-6 mb-6">
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
        {project.highlights && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <ul className="list-disc pl-5 space-y-2 text-zinc-300">
              {project.highlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tech Stack */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span 
                key={tech.name}
                className="px-3 py-1 bg-zinc-800 rounded-full text-sm"
                style={{ color: tech.color }}
              >
                {tech.name}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Links</h2>
          <div className="space-y-2">
            {project.links.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
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