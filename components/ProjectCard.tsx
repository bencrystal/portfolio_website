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
        
        <div className="p-8 lg:p-10 flex flex-col flex-grow">
          <h3 className="text-2xl lg:text-3xl font-semibold mb-4 line-clamp-2 text-white tracking-tight group-hover:text-cyan-300 transition-colors duration-300 ease-out leading-tight">
            {project.title}
          </h3>
          <p className="text-zinc-300 mb-8 line-clamp-3 flex-grow leading-relaxed text-base lg:text-lg font-light">
            {project.description}
          </p>
          
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-auto">
              {project.techStack.slice(0, 5).map(tech => (
                <span 
                  key={tech.name}
                  className="tag px-4 py-2 bg-white/8 backdrop-blur-sm rounded-full text-sm font-medium text-zinc-300 border border-white/5"
                >
                  {tech.name}
                </span>
              ))}
              {project.techStack.length > 5 && (
                <span className="tag px-4 py-2 bg-white/5 rounded-full text-sm font-medium text-zinc-400 border border-white/5">
                  +{project.techStack.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}; 