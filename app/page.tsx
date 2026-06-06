'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Background from '@/components/Background'
import { ProjectCard } from '@/components/ProjectCard'
import { HeroAbout } from '@/components/landing/HeroAbout'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { PillButton } from '@/components/ui/PillButton'
import type { Project } from '@/types/Project'
import { projects } from '@/data/projects'

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

export default function Page() {
  const [showAbout, setShowAbout] = useState(false)
  const [scrolledPastHero, setScrolledPastHero] = useState(false)
  const aboutRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const projectsRef = useRef<HTMLDivElement>(null)

  const projectData = useMemo(buildCategories, [])

  // Smooth-scroll into the about panel when it opens.
  useEffect(() => {
    if (showAbout) {
      aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showAbout])

  // Track whether we've scrolled past the hero (for nav-dot highlighting).
  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY >= 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fade-in sections as they enter the viewport.
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

  const scrollToHero = () =>
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className="min-h-screen min-h-dvh bg-zinc-950 relative">
      <Background />

      {/* Floating navigation dots (desktop only) */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
        <button
          onClick={scrollToHero}
          aria-label="Go to top"
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            !scrolledPastHero ? 'bg-cyan-400 scale-125' : 'bg-white/30 hover:bg-white/60'
          }`}
        />
        <button
          onClick={scrollToProjects}
          aria-label="Go to projects"
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            scrolledPastHero ? 'bg-cyan-400 scale-125' : 'bg-white/30 hover:bg-white/60'
          }`}
        />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <section
          ref={heroRef}
          className="min-h-[60vh] flex items-center justify-center px-6 py-20 sm:py-24"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 text-transparent bg-clip-text">
                Creating immersive
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-transparent bg-clip-text">
                experiences
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              XR creative technologist helping people express themselves
              in ways they&apos;ve never imagined.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <PillButton onClick={() => setShowAbout((v) => !v)} variant="gradient" size="md">
                {showAbout ? 'Hide bio' : 'Learn more about me'}
              </PillButton>

              <button
                onClick={scrollToProjects}
                className="group flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-cyan-300 transition-all duration-300"
              >
                <span>View my work</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-y-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <HeroAbout show={showAbout} sectionRef={aboutRef} />

        {/* Projects */}
        <div ref={projectsRef} id="projects" className="pt-8">
          {projectData.map((category) => (
            <section key={category.title} className="py-20 first:pt-8">
              <div className="max-w-6xl mx-auto px-6">
                <div className="mb-16">
                  <SectionHeader>{category.title}</SectionHeader>
                </div>

                <div className="fade-in-section opacity-0 translate-y-8 transition-all duration-700 ease-out grid grid-cols-1 lg:grid-cols-2 gap-10 auto-rows-fr">
                  {category.projects.map((project, i) => (
                    <div
                      key={project.id}
                      className="fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
