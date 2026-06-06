import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/types/Project'
import { GlassCard } from '@/components/ui/GlassCard'

interface ProjectCardProps {
  project: Project
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const extraTech = project.techStack.length - 4

  return (
    <Link href={`/projects/${project.id}`} className="block group h-full">
      <GlassCard className="project-card apple-glow overflow-hidden flex flex-col h-full transition-all duration-500 hover:border-white/20 hover:bg-zinc-950/70">
        <div className="relative aspect-video overflow-hidden flex-shrink-0">
          <Image
            src={project.thumbnail}
            alt={project.title}
            width={800}
            height={450}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out" />
        </div>

        <div className="p-6 lg:p-8 flex flex-col flex-grow">
          <h3 className="text-xl lg:text-2xl font-semibold mb-3 text-white tracking-tight leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors duration-300">
            {project.title}
          </h3>
          <p className="text-sm lg:text-base text-zinc-300 mb-6 leading-relaxed font-light line-clamp-3 flex-grow">
            {project.description}
          </p>

          {project.techStack.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-auto">
              {project.techStack.slice(0, 4).map((tech) => (
                <span
                  key={tech.name}
                  className="tag px-3 py-1.5 bg-white/[0.08] backdrop-blur-sm rounded-full text-xs font-medium text-zinc-300"
                >
                  {tech.name}
                </span>
              ))}
              {extraTech > 0 && (
                <span className="tag px-3 py-1.5 bg-white/5 rounded-full text-xs font-medium text-zinc-400">
                  +{extraTech}
                </span>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </Link>
  )
}
