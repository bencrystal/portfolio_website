import { projects } from '@/data/projects'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProjectContent } from '@/components/projects/ProjectContent'

const ACCENT = '#57f1ff'

export async function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }))
}

const formatMonthYear = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = projects.find((p) => p.id === params.id)
  if (!project) notFound()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] font-bold">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-colors"
            >
              Portfolio
            </Link>
            <span className="text-white/30">/</span>
            <span style={{ color: ACCENT }}>{project.title}</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          {project.category && project.category.length > 0 && (
            <p
              className="text-xs font-bold uppercase tracking-[0.3em] mb-8"
              style={{ color: ACCENT }}
            >
              {project.category.join(' · ')} · {formatMonthYear(project.startDate)}
            </p>
          )}

          <h1 className="font-black tracking-[-0.04em] uppercase leading-[0.85] mb-10 text-[12vw] sm:text-[10vw] lg:text-[8rem]">
            {project.title}
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-white/70 leading-snug mb-16 max-w-4xl font-light">
            {project.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12 max-w-4xl">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                Timeline
              </h3>
              <p className="text-lg text-white">
                {formatMonthYear(project.startDate)} —{' '}
                {project.endDate ? formatMonthYear(project.endDate) : 'Present'}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mb-3">
                Key Technologies
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium uppercase tracking-widest text-white">
                {project.techStack.slice(0, 4).map((tech) => (
                  <span key={tech.name}>{tech.name}</span>
                ))}
                {project.techStack.length > 4 && (
                  <span className="text-white/50">
                    +{project.techStack.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {project.links && project.links.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {project.links.map((link, i) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    i === 0
                      ? 'px-6 py-3 font-bold uppercase tracking-widest text-xs text-black transition-transform hover:-translate-y-0.5'
                      : 'px-6 py-3 font-bold uppercase tracking-widest text-xs text-white border border-white/30 hover:border-white transition-colors'
                  }
                  style={i === 0 ? { backgroundColor: ACCENT } : undefined}
                >
                  {link.type.charAt(0).toUpperCase() + link.type.slice(1)} →
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
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {project.highlights && project.highlights.length > 0 && (
            <div>
              <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-8">
                Key Features<span style={{ color: ACCENT }}>.</span>
              </h3>
              <ul className="space-y-5">
                {project.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span
                      className="inline-block w-2 h-2 rounded-full mt-2.5 flex-shrink-0"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <span className="text-lg text-white/80 leading-relaxed">
                      {highlight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-8">
              Technologies<span style={{ color: ACCENT }}>.</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {project.techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="px-4 py-3 border border-white/10 text-sm font-medium uppercase tracking-widest text-white/90 hover:border-white/30 transition-colors"
                >
                  {tech.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <section className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] text-white hover:text-[#57f1ff] transition-colors"
          >
            <span className="inline-block transition-transform group-hover:-translate-x-1">←</span>
            Back to Portfolio
          </Link>
        </div>
      </section>
    </main>
  )
}
