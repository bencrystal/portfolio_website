import { projects } from '@/data/projects'
import { notFound } from 'next/navigation'
import Background from '@/components/Background'
import Link from 'next/link'
import { ProjectContent } from '@/components/projects/ProjectContent'
import { GlassCard } from '@/components/ui/GlassCard'

export async function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }))
}

const formatMonthYear = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id)
  if (!project) notFound()

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative">
      <Background
        text={project.backgroundText}
        fontSize={project.backgroundFontSize}
        spacing={project.backgroundSpacing}
      />

      <div className="relative z-30">
        {/* Breadcrumb */}
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

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-32">
          <div className="max-w-4xl">
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

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold mb-8 text-white tracking-tight leading-[0.9] bg-gradient-to-b from-white to-zinc-300 text-transparent bg-clip-text">
              {project.title}
            </h1>

            <p className="text-2xl md:text-3xl text-zinc-400 leading-relaxed mb-16 max-w-4xl font-light">
              {project.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                  Timeline
                </h3>
                <p className="text-xl text-zinc-200 font-light">
                  {formatMonthYear(project.startDate)} —{' '}
                  {project.endDate ? formatMonthYear(project.endDate) : 'Present'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Key Technologies
                </h3>
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

        {/* Content */}
        {project.content && project.content.length > 0 && (
          <ProjectContent content={project.content} />
        )}

        {/* Highlights + Tech */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {project.highlights && project.highlights.length > 0 && (
              <GlassCard className="p-10">
                <h3 className="text-3xl font-semibold mb-8 text-white">Key Features</h3>
                <ul className="space-y-6">
                  {project.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-3 flex-shrink-0" />
                      <span className="text-lg text-zinc-300 leading-relaxed font-light">
                        {highlight}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}

            <GlassCard className="p-10">
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
            </GlassCard>
          </div>
        </section>

        {/* Back link */}
        <section className="max-w-6xl mx-auto px-6 pb-16">
          <div className="text-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl border border-white/[0.12] hover:border-white/[0.2] rounded-full font-medium transition-all duration-300 ease-out"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Portfolio
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
