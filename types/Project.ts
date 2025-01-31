export type TechStack = {
  name: string;
  icon?: string;    // Path to icon or icon component name
  color?: string;   // Optional brand color
}

export type ProjectLink = {
  type: 'github' | 'live' | 'demo' | 'docs';
  url: string;
  label?: string;
}

// Add a new type for content sections
type ContentSection = {
  type: 'text' | 'video' | 'image' | 'download';
  content: string;
  title?: string;
  caption?: string;
  url?: string;
}

export interface Project {
  id: string;                // Unique identifier
  title: string;            // Project name
  description: string;      // Brief description
  longDescription?: string; // Detailed description
  thumbnail: string;        // Path to thumbnail image
  images?: string[];        // Additional project images
  techStack: TechStack[];   // Technologies used
  links: ProjectLink[];     // Project links
  featured: boolean;        // Whether to highlight this project
  startDate: Date;         // Project start date
  endDate?: Date;          // Project end date (optional for ongoing)
  highlights?: string[];   // Key features or achievements
  category?: string[];     // Project categories (e.g., ['Web', 'Mobile'])
  content?: ContentSection[];
  backgroundText?: string;  // Custom text for background animation
  backgroundFontSize?: number;  // Add font size option
  backgroundSpacing?: number;  // Add spacing control
}

// Example usage:
const exampleProject: Project = {
  id: 'interactive-background',
  title: 'Interactive Background',
  description: 'A responsive p5.js background with physics-based interactions',
  thumbnail: '/images/background-thumb.png',
  techStack: [
    { name: 'TypeScript', icon: 'typescript', color: '#007ACC' },
    { name: 'React', icon: 'react', color: '#61DAFB' },
    { name: 'p5.js', icon: 'p5js' }
  ],
  links: [
    { type: 'github', url: 'https://github.com/...' },
    { type: 'live', url: 'https://...' }
  ],
  featured: true,
  startDate: new Date('2024-01'),
  highlights: [
    'Physics-based interactions',
    'Optimized performance',
    'Mobile responsive'
  ],
  category: ['Web', 'Interactive'],
  content: [
    { type: 'text', content: 'This is a detailed description of the project...' },
    { type: 'video', content: 'https://example.com/video.mp4', title: 'Project Overview' }
  ]
} 