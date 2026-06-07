import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/types/Project'

const ACCENT = '#57f1ff'

interface ProjectCardProps {
  project: Project
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const extraTech = project.techStack.length - 4

  return (
    <Link href={`/projects/${project.id}`} className="block group h-full">
      <article className="project-card relative h-full flex flex-col bg-zinc-950 border border-white/10 hover:border-white/30 transition-colors overflow-hidden">
        <div className="relative aspect-video overflow-hidden flex-shrink-0 border-b border-white/10">
          <Image
            src={project.thumbnail}
            alt={project.title}
            width={800}
            height={450}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {project.category && project.category.length > 0 && (
            <div
              className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-black"
              style={{ backgroundColor: ACCENT }}
            >
              {project.category[0]}
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8 flex flex-col flex-grow">
          <h3 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter leading-[0.95] mb-4 line-clamp-2">
            {project.title}
          </h3>
          <p className="text-sm lg:text-base text-zinc-400 mb-6 leading-relaxed line-clamp-3 flex-grow">
            {project.description}
          </p>

          <div className="mt-auto flex items-end justify-between gap-4">
            {project.techStack.length > 0 ? (
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-white/60 uppercase tracking-widest">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span key={tech.name}>{tech.name}</span>
                ))}
                {extraTech > 0 && <span>+{extraTech}</span>}
              </div>
            ) : (
              <span />
            )}
            <span
              className="text-xs font-bold uppercase tracking-widest group-hover:translate-x-1 transition-transform flex-shrink-0"
              style={{ color: ACCENT }}
            >
              Open →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
