'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
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

  useEffect(() => {
    if (showAbout) {
      aboutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showAbout])

  useEffect(() => {
    const onScroll = () => setScrolledPastHero(window.scrollY >= 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
        {/* Editorial hero */}
        <section
          ref={heroRef}
          className="min-h-[80vh] px-6 sm:px-10 py-20 sm:py-24 flex items-center"
        >
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400 mb-6">
                Brooklyn · XR · Creative Technology
              </p>

              <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-bold tracking-tight leading-[0.95] mb-8 text-white">
                Building tools for
                <br />
                new ways to
                <br />
                <span className="italic font-light text-cyan-300/90">express yourself.</span>
              </h1>

              <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed font-light mb-10 max-w-xl">
                I&apos;m Ben Crystal — a creative technologist working at the
                intersection of music, engineering, and immersive interaction.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <PillButton variant="gradient" size="md" onClick={scrollToProjects}>
                  View selected work
                </PillButton>
                <PillButton variant="ghost" size="md" onClick={() => setShowAbout((v) => !v)}>
                  {showAbout ? 'Hide bio' : 'About me'}
                </PillButton>
              </div>
            </div>

            <div className="relative aspect-[4/5] w-full max-w-sm justify-self-center lg:justify-self-end">
              <div className="absolute -inset-3 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-3xl blur-2xl opacity-60" />
              <div className="relative rounded-3xl overflow-hidden border border-white/10 aspect-[4/5]">
                <Image
                  src="/headshot.jpg"
                  alt="Ben Crystal"
                  fill
                  sizes="(min-width: 1024px) 24rem, 80vw"
                  className="object-cover"
                  priority
                />
              </div>
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
