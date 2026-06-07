'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Background from '@/components/Background'
import { ProjectCard } from '@/components/ProjectCard'
import { HeroAbout } from '@/components/landing/HeroAbout'
import type { Project } from '@/types/Project'
import { projects } from '@/data/projects'

const ACCENT = '#57f1ff'

interface ProjectCategory {
  title: string
  projects: Project[]
}

const FUNSIES_EXCLUDE = new Set(['dexterous-tree', 'sound-classification', 'lyric-generation'])
const byNewest = (a: Project, b: Project) => b.startDate.getTime() - a.startDate.getTime()

const buildCategories = (): ProjectCategory[] => {
  const flagship = projects.filter((p) => p.category?.includes('Flagship')).sort(byNewest)
  const substantial = projects.filter((p) => p.category?.includes('Substantial')).sort(byNewest)
  const funsies = projects
    .filter(
      (p) =>
        !p.category?.includes('Flagship') &&
        !p.category?.includes('Substantial') &&
        !FUNSIES_EXCLUDE.has(p.id)
    )
    .sort(byNewest)

  return [
    { title: 'Flagship', projects: flagship },
    { title: 'Substantial', projects: substantial },
    { title: 'For Funsies', projects: funsies },
  ].filter((c) => c.projects.length > 0)
}

const MARQUEE_ITEMS = [
  'XR / VR / AR',
  'Music tech',
  'Realtime graphics',
  'Audio DSP',
  'Creative coding',
  'Immersive design',
]

export default function Page() {
  const [showAbout, setShowAbout] = useState(false)
  const aboutRef = useRef<HTMLElement>(null)
  const projectsRef = useRef<HTMLDivElement>(null)

  const projectData = useMemo(buildCategories, [])

  useEffect(() => {
    if (showAbout) {
      aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showAbout])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0')
            entry.target.classList.remove('opacity-0', 'translate-y-8')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.05, rootMargin: '100px' }
    )
    document.querySelectorAll('.fade-in-section').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToProjects = () =>
    projectsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className="min-h-screen min-h-dvh bg-black relative overflow-x-hidden">
      <Background maskHero />

      <div className="relative z-10">
        {/* Hero */}
        <section className="px-6 pt-12 sm:pt-20 pb-10">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/50 mb-8 sm:mb-12">
              Creative Technologist / Brooklyn / Available 2026
            </p>

            <h1 className="font-black tracking-[-0.04em] leading-[0.85] uppercase">
              <span className="block text-[14vw] sm:text-[11vw] lg:text-[9rem]">
                Create
              </span>
              <span
                className="block text-[14vw] sm:text-[11vw] lg:text-[9rem]"
                style={{ color: ACCENT }}
              >
                Unreal
              </span>
              <span className="block text-[14vw] sm:text-[11vw] lg:text-[9rem]">
                Things.
              </span>
            </h1>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <p className="md:col-span-7 text-base sm:text-lg text-white/75 leading-snug font-medium max-w-2xl">
                I&apos;m Ben Crystal — building instruments for new ways to express yourself across XR, audio, and the web.
              </p>
              <div className="md:col-span-4 md:col-start-9 flex gap-3">
                <button
                  onClick={scrollToProjects}
                  className="flex-1 text-center px-5 py-3 font-bold uppercase tracking-widest text-xs text-black transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: ACCENT }}
                >
                  Work →
                </button>
                <button
                  onClick={() => setShowAbout((v) => !v)}
                  className="flex-1 text-center px-5 py-3 font-bold uppercase tracking-widest text-xs text-white border border-white/30 hover:border-white transition-colors"
                >
                  {showAbout ? 'Hide' : 'About'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee strip */}
        <div
          className="border-y border-white/20 py-3 overflow-hidden whitespace-nowrap"
          style={{ backgroundColor: ACCENT }}
        >
          <div className="marquee-track inline-flex text-black font-black uppercase tracking-tighter text-xl gap-10 px-6">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-10">
                {item}
                <span aria-hidden>●</span>
              </span>
            ))}
          </div>
        </div>

        <HeroAbout show={showAbout} sectionRef={aboutRef} />

        {/* Projects */}
        <div ref={projectsRef} id="projects">
          {projectData.map((category, ci) => (
            <section
              key={category.title}
              className={`border-b border-white/10 ${ci === 0 ? 'pt-12' : 'pt-16'} pb-16`}
            >
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-baseline justify-between mb-10">
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase">
                    {category.title}
                    <span style={{ color: ACCENT }}>.</span>
                  </h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {String(category.projects.length).padStart(2, '0')} selected
                  </span>
                </div>

                <div className="fade-in-section opacity-0 translate-y-8 transition-all duration-700 ease-out grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-fr">
                  {category.projects.map((project, i) => (
                    <div
                      key={project.id}
                      className="fade-in"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>

        <footer className="px-6 py-8 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
          <span>BK / NY</span>
          <span style={{ color: ACCENT }}>● BC 2026</span>
        </footer>
      </div>
    </main>
  )
}
