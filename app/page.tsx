'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Background from "@/components/Background"
import { ProjectCard } from '@/components/ProjectCard'
import { Project } from '@/types/Project'
import { projects } from '@/data/projects'

interface ProjectCategory {
  title: string;
  projects: Project[];
}

// Organize projects by the new three-tier system
const getProjectsByCategory = (): ProjectCategory[] => {
  // Flagship: Projects with "Flagship" category
  const flagshipProjects = projects.filter(p => 
    p.category?.includes('Flagship')
  );
  
  // Substantial: Projects with "Substantial" category
  const substantialProjects = projects.filter(p => 
    p.category?.includes('Substantial')
  );
  
  // For Funsies: Everything else
  const funProjects = projects.filter(p => 
    !p.category?.includes('Flagship') && 
    !p.category?.includes('Substantial') &&
    !['dexterous-tree', 'sound-classification', 'lyric-generation'].includes(p.id)
  );
  
  const categories: ProjectCategory[] = [];
  
  if (flagshipProjects.length > 0) {
    categories.push({
      title: "Flagship",
      projects: flagshipProjects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    });
  }
  
  if (substantialProjects.length > 0) {
    categories.push({
      title: "Substantial",
      projects: substantialProjects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    });
  }
  
  if (funProjects.length > 0) {
    categories.push({
      title: "For Funsies",
      projects: funProjects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    });
  }
  
  return categories;
};

const projectData = getProjectsByCategory();

export default function Page() {
  const [showAbout, setShowAbout] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollToProjects = () => {
    if (projectsRef.current) {
      projectsRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    if (showAbout) {
      scrollToSection(aboutSectionRef);
    }
  }, [showAbout]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '100px'
    });

    // Add intersection observer to all sections
    document.querySelectorAll('.fade-in-section').forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, [showAbout]);

  return (
    <main className="min-h-screen relative">
      <Background />
      
      {/* Floating Navigation Dots - Apple style */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col gap-3">
        <button 
          onClick={() => scrollToSection(heroRef)}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${scrollY < 400 ? 'bg-cyan-400 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
          aria-label="Go to top"
        />
        <button 
          onClick={scrollToProjects}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${scrollY >= 400 ? 'bg-cyan-400 scale-125' : 'bg-white/30 hover:bg-white/60'}`}
          aria-label="Go to projects"
        />
      </div>
      
      <div className="relative z-10">
        {/* Hero Section - Adjusted height to show content peeking */}
        <section ref={heroRef} className="min-h-[75vh] flex items-center justify-center relative">
          <div className="max-w-4xl mx-auto text-center px-6">
            {/* Main Headline - Apple-style emphasis */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-white via-zinc-100 to-zinc-300 text-transparent bg-clip-text">
                Creating immersive
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-transparent bg-clip-text">
                experiences
              </span>
            </h1>

            {/* Subtitle - Clean and focused */}
            <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              XR creative technologist helping people express themselves 
              in ways they've never imagined.
            </p>

            {/* Enhanced CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => setShowAbout(!showAbout)}
                className="group relative px-8 py-3 text-sm font-medium text-white transition-all duration-300 ease-out"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 group-hover:from-cyan-500/30 group-hover:to-blue-600/30 transition-all duration-300" />
                <div className="absolute inset-0 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300" />
                <div className="relative">Learn more about me</div>
              </button>
              
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scroll indicator at bottom of hero */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </section>

        {/* About Section - Seamless integration */}
        <div className={`transition-all duration-700 ease-out ${showAbout ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0'} overflow-hidden`}>
          <section ref={aboutSectionRef} className="py-16">
            <div className="max-w-5xl mx-auto px-6">
              <div className="bg-zinc-950/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                  {/* Portrait */}
                  <div className="w-64 h-64 lg:w-72 lg:h-72 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl" />
                    <Image
                      src="/headshot.jpg"
                      alt="Ben Crystal"
                      width={288}
                      height={288}
                      priority
                      className="relative object-cover rounded-2xl"
                    />
                  </div>
                  
                  {/* Bio content */}
                  <div className="flex-1 text-center lg:text-left">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white tracking-tight">
                      Brooklyn-based creative technologist
                    </h2>
                    <div className="space-y-6 text-zinc-300 leading-relaxed">
                      <p className="text-lg font-light">
                        I blend engineering and creativity to build immersive experiences 
                        that bridge the physical and digital worlds.
                      </p>
                      <p className="text-lg font-light">
                        With a background spanning music, electrical engineering, and interaction design, 
                        I create tools that enhance natural creativity and enable new forms of expression.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Projects Section - Clean spacing with content preview */}
        <div ref={projectsRef} id="projects" className="pt-8">
          {projectData.map((category, index) => (
            <section 
              key={index} 
              className="py-16 first:pt-8"
            >
              <div className="max-w-5xl mx-auto px-6">
                {/* Section Header - Always visible */}
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-semibold mb-6 text-white tracking-tight">
                    {category.title}
                  </h2>
                  <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto opacity-80" />
                </div>
                
                {/* Project Grid - Animated */}
                <div className="fade-in-section opacity-0 translate-y-8 transition-all duration-700 ease-out grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                  {category.projects.map((project, projectIndex) => (
                    <div 
                      key={project.id}
                      className="transform transition-all duration-700 ease-out"
                      style={{ 
                        animationDelay: `${projectIndex * 100}ms`,
                        opacity: 0,
                        transform: 'translateY(20px)'
                      }}
                      ref={(el) => {
                        if (el) {
                          setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                          }, projectIndex * 100);
                        }
                      }}
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
  );
}