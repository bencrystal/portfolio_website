'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Background from "@/components/Background"

interface Project {
  title: string;
  description: string;
  image: string;
  dateRange: string;
  tags: string[];
  link?: string;
}

interface ProjectCategory {
  title: string;
  projects: Project[];
}

const projectData: ProjectCategory[] = [
  {
    title: "VR Projects",
    projects: [
      {
        title: "Space Jam: VR Vocal Performance Space",
        description: "An immersive virtual environment for vocal performance and musical expression",
        image: "/projects/space-jam.jpg",
        dateRange: "September 2020 - Present",
        tags: ["VR", "music technology", "interaction design"],
        link: "#"
      },
      {
        title: "Celicollector: Scavenger VR Game",
        description: "Interactive VR game focused on collection and exploration",
        image: "/projects/celicollector.jpg",
        dateRange: "September 2020 - Present",
        tags: ["interaction design", "VR", "game design"],
        link: "#"
      },
      {
        title: "Panaudicon: The Audible Surveillance State",
        description: "An exploration of sound and surveillance in virtual reality",
        image: "/projects/panaudicon.jpg",
        dateRange: "September - December 2021",
        tags: ["interaction design", "machine learning"],
        link: "#"
      }
    ]
  },
  {
    title: "Design and Engineering Projects",
    projects: [
      {
        title: "Vocal Harmonizer",
        description: "A handheld vocal harmony synthesizer with real-time processing",
        image: "/projects/harmonizer.jpg",
        dateRange: "2020 - 2021",
        tags: ["electronics", "physical computing", "music technology"],
        link: "#"
      },
      {
        title: "Machine Learning Series",
        description: "Projects exploring sound classification and lyric generation",
        image: "/projects/ml-series.jpg",
        dateRange: "2021 - Present",
        tags: ["machine learning", "natural language processing"],
        link: "#"
      },
      {
        title: "Wrip Watch Branding",
        description: "Brand design for a hypothetical smartwatch company",
        image: "/projects/wrip.jpg",
        dateRange: "2021",
        tags: ["graphic design", "UX/UI"],
        link: "#"
      }
    ]

    
  },
  {
    title: "Other Projects",
    projects: [
      {
        title: "Music",
        description: "A handheld vocal harmony synthesizer with real-time processing",
        image: "/projects/harmonizer.jpg",
        dateRange: "2020 - 2021",
        tags: ["electronics", "physical computing", "music technology"],
        link: "#"
      },
      {
        title: "Machine Learning Series",
        description: "Projects exploring sound classification and lyric generation",
        image: "/projects/ml-series.jpg",
        dateRange: "2021 - Present",
        tags: ["machine learning", "natural language processing"],
        link: "#"
      },
      {
        title: "Wrip Watch Branding",
        description: "Brand design for a hypothetical smartwatch company",
        image: "/projects/wrip.jpg",
        dateRange: "2021",
        tags: ["graphic design", "UX/UI"],
        link: "#"
      }
    ]
  }
];

const imageLoader = ({ src }: { src: string }) => {
  return src;
};

export default function Page() {
  const [showAbout, setShowAbout] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
              Welcome to Ben Crystal's website! ✨
            </h1>
            <p className="text-xl text-zinc-300 mb-4">
              I'm an XR creative technologist and electrical engineer based in Brooklyn, NY.
            </p>
            <p className="text-xl text-zinc-300 mb-8">
              My dream is to help people express themselves in ways they've never imagined.
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
                onClick={() => setShowResume(!showResume)}
              >
                Resume
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
          <section className="container mx-auto px-4 py-8 fade-in">
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
                      I'm a creative technologist and electrical engineer with a passion for building immersive experiences 
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

        {/* Expandable Resume Section */}
        {showResume && (
          <section className="container mx-auto px-4 py-8 fade-in">
            <div className="max-w-4xl bg-zinc-950/30 backdrop-blur-sm rounded-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">Resume</h2>
                <Button 
                  variant="outline" 
                  className="hover:bg-blue-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
                  asChild
                >
                  <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download PDF
                  </a>
                </Button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-cyan-400">Education</h3>
                  <p className="text-zinc-300">NYU Tandon School of Engineering</p>
                  <p className="text-zinc-400">B.S. Electrical Engineering, Minor in Computer Science</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-cyan-400">Skills</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Unity", "C#", "Python", "Machine Learning", "VR Development", "Physical Computing", 
                      "Signal Processing", "Interactive Design", "MATLAB", "Git"].map(skill => (
                      <span key={skill} className="px-2 py-1 text-sm rounded-full bg-zinc-800/50 text-zinc-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Project Categories */}
        {projectData.map((category, categoryIndex) => (
          <section key={category.title} className="container mx-auto px-4 py-16">
            <h2 className="text-3xl font-bold mb-12 fade-in text-zinc-100">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.projects.map((project, projectIndex) => (
                <div
                  key={project.title}
                  className="group relative bg-zinc-950/30 backdrop-blur-sm rounded-lg overflow-hidden fade-in hover:scale-[1.02] transition-transform duration-300"
                  style={{ animationDelay: `${(projectIndex + 1) * 0.2}s` }}
                >
                  <div className="aspect-video relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent z-10" />
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-sm text-zinc-400 mb-4">
                      {project.dateRange}
                    </p>
                    <p className="text-zinc-300 mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-zinc-800/50 text-zinc-300 backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}