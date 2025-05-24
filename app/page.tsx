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
  // Flagship: Space Jam, Vocal Harmonizer
  const flagshipProjects = projects.filter(p => 
    p.id === 'space-jam-vr' || p.id === 'vocal-harmonizer'
  );
  
  // Substantial: Calicollector, ML Series, Panaudicon, Wrip Watch
  const substantialProjects = projects.filter(p => 
    p.id === 'calicollector' || p.id === 'ml-series' || 
    p.id === 'panaudicon' || p.id === 'wrip-watch'
  );
  
  // For Funsies: Affectimer and others
  const funProjects = projects.filter(p => 
    p.id === 'affectimer' || p.id === 'interactive-background' ||
    (!flagshipProjects.find(fp => fp.id === p.id) && 
     !substantialProjects.find(sp => sp.id === p.id) &&
     !['dexterous-tree', 'sound-classification', 'lyric-generation'].includes(p.id))
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
      title: "For Funsies :)",
      projects: funProjects.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
    });
  }
  
  return categories;
};

const projectData = getProjectsByCategory();

export default function Page() {
  const [showAbout, setShowAbout] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const aboutSectionRef = useRef<HTMLElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  useEffect(() => {
    if (showAbout) {
      scrollToSection(aboutSectionRef);
    }
  }, [showAbout]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });

    document.querySelectorAll('.fade-in').forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <main className="min-h-screen relative">
      <Background />
      
      <div className="relative z-10">
        {/* Hero Section - Apple-like refinements */}
        <section className="container mx-auto px-6 pt-16 pb-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text leading-tight tracking-tight">
              Welcome to Ben Crystal&apos;s website! ✨
            </h1>
            <div className="space-y-6 mb-12">
              <p className="text-xl md:text-2xl text-zinc-300 font-medium leading-relaxed">
                I&apos;m an XR creative technologist and electrical engineer based in Brooklyn, NY.
              </p>
              <p className="text-xl md:text-2xl text-zinc-300 leading-relaxed">
                My dream is to help people express themselves in ways they&apos;ve never imagined.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-200 ease-out text-sm font-medium"
                onClick={() => setShowAbout(!showAbout)}
              >
                About Me
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-blue-500/20 hover:border-blue-400/30 transition-all duration-200 ease-out text-sm font-medium"
                asChild
              >
                <a 
                  href={`/resume.pdf?t=${Date.now()}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Resume
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-purple-500/20 hover:border-purple-400/30 transition-all duration-200 ease-out text-sm font-medium"
                asChild
              >
                <a href="https://www.linkedin.com/in/ben-crystal/" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-green-500/20 hover:border-green-400/30 transition-all duration-200 ease-out text-sm font-medium"
                asChild
              >
                <a href="https://github.com/bencrystal" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Expandable About Section - Apple-like refinements */}
        {showAbout && (
          <section ref={aboutSectionRef} className="container mx-auto px-6 fade-in transition-all duration-300 ease-out">
            <div className="max-w-5xl mx-auto bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-72 h-72 lg:w-80 lg:h-80 relative flex-shrink-0 mx-auto lg:mx-0">
                  <Image
                    src="/headshot.jpg"
                    alt="Ben Crystal"
                    width={320}
                    height={320}
                    priority
                    className="object-cover rounded-2xl"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-6 text-zinc-100 tracking-tight">About Me</h2>
                  <div className="space-y-6 text-zinc-300 leading-relaxed">
                    <p className="text-lg">
                      I&apos;m a creative technologist and electrical engineer with a passion for building immersive experiences 
                      that blend the physical and digital worlds. With a background in music, engineering, and interaction design, 
                      I create tools and experiences that help people express themselves in new and meaningful ways.
                    </p>
                    <p className="text-lg">
                      My work spans virtual and augmented reality, machine learning, and physical computing, always with a focus on 
                      creating intuitive and engaging user experiences. I believe technology should enhance our natural 
                      creativity and enable new forms of expression.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects Sections - Apple-like spacing and typography */}
        <div className={`transition-all duration-300 ease-out ${showAbout ? 'pt-4' : 'pt-0'}`}>
          {projectData.map((category, index) => (
            <section key={index} className="container mx-auto px-6 py-12">
              <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-10 text-zinc-100 tracking-tight">
                  {category.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                  {category.projects.map((project) => (
                    <ProjectCard 
                      key={project.id}
                      project={project}
                    />
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