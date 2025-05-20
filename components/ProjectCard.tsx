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
      className="block group transition-transform hover:scale-[1.02]"
    >
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg h-[400px] flex flex-col">
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          <Image 
            src={project.thumbnail} 
            alt={project.title}
            width={640}
            height={360}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold mb-2 line-clamp-1">{project.title}</h3>
          <p className="text-gray-300 mb-4 line-clamp-2 flex-grow">{project.description}</p>
          
          {project.techStack && project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {project.techStack.map(tech => (
                <span 
                  key={tech.name}
                  className="px-2 py-1 bg-gray-700 rounded-full text-sm"
                  style={{ color: tech.color }}
                >
                  {tech.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}; 