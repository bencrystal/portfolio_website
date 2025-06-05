import { Project } from '@/types/Project';
import Link from 'next/link';
import Image from 'next/image';

interface ProjectCardProps {
  project: Project;
  variant?: 'default' | 'featured';
}

export const ProjectCard = ({ project, variant = 'default' }: ProjectCardProps) => {
  return (
    <Link 
      href={`/projects/${project.id}`}
      className="block group h-full"
    >
      <div className="project-card apple-glow bg-zinc-950/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 hover:bg-zinc-950/70 flex flex-col h-full transition-all duration-500 hover:scale-[1.02]">
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          <Image 
            src={project.thumbnail} 
            alt={project.title}
            width={800}
            height={450}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {/* Apple-like overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />
        </div>
        
        <div className="p-6 lg:p-8 flex flex-col flex-grow min-h-0">
          <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-white tracking-tight group-hover:text-cyan-300 transition-colors duration-300 ease-out leading-tight overflow-hidden" 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.2'
              }}>
            {project.title}
          </h3>
          <p className="text-zinc-300 mb-6 flex-grow leading-relaxed text-sm lg:text-base font-light overflow-hidden" 
             style={{
               display: '-webkit-box',
               WebkitLineClamp: 3,
               WebkitBoxOrient: 'vertical',
               lineHeight: '1.5'
             }}>
            {project.description}
          </p>
          
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {project.techStack.slice(0, 4).map(tech => (
                <span 
                  key={tech.name}
                  className="tag px-3 py-1.5 bg-white/8 backdrop-blur-sm rounded-full text-xs font-medium text-zinc-300 border border-white/5"
                >
                  {tech.name}
                </span>
              ))}
              {project.techStack.length > 4 && (
                <span className="tag px-3 py-1.5 bg-white/5 rounded-full text-xs font-medium text-zinc-400 border border-white/5">
                  +{project.techStack.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}; 