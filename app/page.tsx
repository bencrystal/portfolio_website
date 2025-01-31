'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Background from "@/components/Background"
import { ProjectCard } from '@/components/ProjectCard'
import { Project } from '@/types/Project'

interface ProjectCategory {
  title: string;
  projects: Project[];
}

const projectData: ProjectCategory[] = [
  {
    title: "VR Projects",
    projects: [
      {
        id: 'space-jam-vr',
        title: "Space Jam: VR Vocal Performance Space",
        description: "An immersive virtual environment for vocal performance and musical expression",
        thumbnail: "/projects/space-jam.jpg",
        images: ["/projects/space-jam.jpg"],
        techStack: [
          { name: "VR", color: "#1CA0F2" },
          { name: "Unity", color: "#000000" },
          { name: "C#", color: "#178600" }
        ],
        links: [
          { type: "demo", url: "https://youtu.be/L_9KwXF9G6g" },
          { type: "docs", url: "https://www.notion.so/VR-Vocal-Performance-Space-dffa59f27c6d4649b71c3bef6c298320" }
        ],
        featured: true,
        startDate: new Date('2020-09'),
        highlights: [
          "Real-time vocal harmonization",
          "Gesture-based controls",
          "Automatic key and tempo matching"
        ],
        category: ["VR", "Music", "Interactive"]
      },
      {
        id: 'calicollector',
        title: "Calicollector: Scavenger VR Game",
        description: "Interactive VR game focused on collection and exploration",
        thumbnail: "/projects/calicollector.jpg",
        images: ["/projects/calicollector.jpg"],
        techStack: [
          { name: "VR", color: "#1CA0F2" },
          { name: "Unity", color: "#000000" },
          { name: "Game Design", color: "#E44D26" }
        ],
        links: [
          { type: "github", url: "#" }
        ],
        featured: false,
        startDate: new Date('2020-09'),
        category: ["VR", "Game Design"]
      },
      {
        id: 'panaudicon',
        title: "Panaudicon: The Audible Surveillance State",
        description: "An exploration of sound and surveillance in virtual reality",
        thumbnail: "/projects/panaudicon.jpg",
        images: ["/projects/panaudicon.jpg"],
        techStack: [
          { name: "VR", color: "#1CA0F2" },
          { name: "ML", color: "#FF6F00" }
        ],
        links: [
          { type: "demo", url: "#" }
        ],
        featured: false,
        startDate: new Date('2021-09'),
        endDate: new Date('2021-12'),
        category: ["VR", "Machine Learning"]
      }
    ]
  },
  {
    title: "Design and Engineering Projects",
    projects: [
      {
        id: 'vocal-harmonizer',
        title: "Vocal Harmonizer",
        description: "A handheld vocal harmony synthesizer with real-time processing",
        longDescription: "A portable device that enables real-time vocal harmonization...",
        thumbnail: "/projects/harmonizer.jpg",
        images: ["/projects/harmonizer.jpg"],
        techStack: [
          { name: "Electronics", color: "#00979D" },
          { name: "Arduino", color: "#00979D" },
          { name: "DSP", color: "#FF9900" }
        ],
        links: [
          { type: "github", url: "#" },
          { type: "demo", url: "#" }
        ],
        featured: true,
        startDate: new Date('2020-01'),
        endDate: new Date('2021-12'),
        highlights: [
          "Real-time audio processing",
          "Custom PCB design",
          "Intuitive physical controls"
        ],
        category: ["Hardware", "Music", "Electronics"]
      },
      {
        id: 'ml-series',
        title: "Machine Learning Series",
        description: "Projects exploring sound classification and lyric generation",
        longDescription: "A series of experiments in machine learning applications for music...",
        thumbnail: "/projects/ml-series.jpg",
        images: ["/projects/ml-series.jpg"],
        techStack: [
          { name: "Python", color: "#3776AB" },
          { name: "TensorFlow", color: "#FF6F00" },
          { name: "NLP", color: "#4B8BBE" }
        ],
        links: [
          { type: "github", url: "#" },
          { type: "docs", url: "#" }
        ],
        featured: true,
        startDate: new Date('2021-01'),
        highlights: [
          "Sound classification models",
          "Lyric generation using GPT",
          "Real-time audio analysis"
        ],
        category: ["Machine Learning", "Music", "NLP"]
      },
      {
        id: 'wrip-watch',
        title: "Wrip Watch Branding",
        description: "Brand design for a hypothetical smartwatch company",
        longDescription: "Complete brand identity design for an innovative smartwatch startup...",
        thumbnail: "/projects/wrip.jpg",
        images: ["/projects/wrip.jpg"],
        techStack: [
          { name: "Figma", color: "#F24E1E" },
          { name: "Illustrator", color: "#FF9A00" },
          { name: "UI/UX", color: "#4353FF" }
        ],
        links: [
          { type: "live", url: "#" }
        ],
        featured: false,
        startDate: new Date('2021-01'),
        endDate: new Date('2021-12'),
        highlights: [
          "Brand identity system",
          "UI/UX design",
          "Marketing materials"
        ],
        category: ["Design", "Branding"]
      }
    ]
  },
  {
    title: "Other Projects",
    projects: [
      {
        id: 'music-portfolio',
        title: "Music",
        description: "Collection of original music and sound design work",
        longDescription: "Portfolio of musical works spanning various genres and techniques...",
        thumbnail: "/projects/harmonizer.jpg",
        images: ["/projects/harmonizer.jpg"],
        techStack: [
          { name: "Ableton", color: "#00CF3F" },
          { name: "Max/MSP", color: "#525252" },
          { name: "Pro Tools", color: "#7ACB10" }
        ],
        links: [
          { type: "demo", url: "#" },
          { type: "live", url: "#" }
        ],
        featured: true,
        startDate: new Date('2020-01'),
        highlights: [
          "Original compositions",
          "Sound design",
          "Live performances"
        ],
        category: ["Music", "Audio"]
      }
    ]
  }
];

const imageLoader = ({ src }: { src: string }) => {
  return src;
};

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
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Welcome to Ben Crystal&apos;s website! ✨
            </h1>
            <p className="text-xl text-zinc-300 mb-4">
              I&apos;m an XR creative technologist and electrical engineer based in Brooklyn, NY.
            </p>
            <p className="text-xl text-zinc-300 mb-8">
              My dream is to help people express themselves in ways they&apos;ve never imagined.
            </p>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="hover:bg-cyan-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
                onClick={() => setShowAbout(!showAbout)}
              >
                About Me
              </Button>
              <Button 
                variant="outline" 
                className="hover:bg-blue-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
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
                className="hover:bg-purple-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
                asChild
              >
                <a href="https://www.linkedin.com/in/ben-crystal/" target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </Button>
              <Button 
                variant="outline" 
                className="hover:bg-green-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
                asChild
              >
                <a href="https://github.com/bencrystal" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Expandable About Section */}
        {showAbout && (
          <section ref={aboutSectionRef} className="container mx-auto px-4 py-8 fade-in transition-all duration-500 ease-out">
            <div className="max-w-4xl bg-zinc-950/30 backdrop-blur-sm rounded-lg p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-48 h-48 relative flex-shrink-0 mx-auto md:mx-0">
                  <Image
                    src="/headshot.jpg"
                    alt="Ben Crystal"
                    width={192}
                    height={192}
                    loader={imageLoader}
                    priority
                    className="object-cover rounded-lg"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-zinc-100">About Me</h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-zinc-300">
                      I&apos;m a creative technologist and electrical engineer with a passion for building immersive experiences 
                      that blend the physical and digital worlds. With a background in music, engineering, and interactive design, 
                      I create tools and experiences that help people express themselves in new and meaningful ways.
                    </p>
                    <p className="text-zinc-300 mt-4">
                      My work spans virtual reality, machine learning, and physical computing, always with a focus on 
                      creating intuitive and engaging user experiences. I believe technology should enhance our natural 
                      creativity and enable new forms of expression.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Projects Sections */}
        <div className={`transition-all duration-500 ease-out transform ${showAbout ? 'translate-y-8 opacity-95' : 'translate-y-0'}`}>
          {projectData.map((category, index) => (
            <section key={index} className="container mx-auto px-4 py-8">
              <div className="max-w-4xl">
                <h2 className="text-2xl font-bold mb-6 text-zinc-100">{category.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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