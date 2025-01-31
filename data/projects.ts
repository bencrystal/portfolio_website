import { Project } from '../types/Project';

export const projects: Project[] = [
  {
    id: 'interactive-background',
    title: 'Interactive Background',
    description: 'A responsive p5.js background with physics-based interactions',
    longDescription: 'A detailed exploration of creative coding using p5.js...',
    thumbnail: '/images/background-thumb.png',
    images: ['/images/background-full.png'],
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
    backgroundText: "^ ◡ ^",
    backgroundFontSize: 8
  },
  {
    id: 'virtual-audio-workstation',
    title: "Virtual Audio Workstation",
    description: "An immersive virtual environment for vocal performance and musical expression",
    content: [
      {
        type: 'text',
        title: 'Vision Pro Live Looper',
        content: "I'm exploring how augmented and spatial reality tools can help people express themselves more freely than ever before. This \"pedalboard in the sky\" is my first prototype that feels easier to use than a lot of hardware interfaces I've tried. It's changed the way I want to play and perform and I'm excited to keep pushing it forward for myself and all of you~ ✨\n\nThis live looper was developed for the Apple Vision Pro, with earlier iterations on Meta Quest devices. It's still in its early stages, and I have plenty of ideas for future improvements and new features."
      },
      {
        type: 'video',
        title: 'Vision Pro Demo',
        content: 'https://www.youtube.com/watch?v=Geu2tB6TieY'
      },
      {
        type: 'text',
        title: 'Background',
        content: 'The majority of audio effects are controlled primarily through two dimensional interfaces. This limits both the functionality of a toolset as well as the embodied connection between users living and acting in a 3D space.'
      },
      {
        type: 'text',
        title: 'Objective',
        content: 'Explore a variety of interaction schema to control an audio landscape using the affordances of Virtual Reality.'
      },
      {
        type: 'video',
        title: 'Demo of Current Iteration',
        content: 'https://youtu.be/L_9KwXF9G6g'
      },
      {
        type: 'text',
        title: 'Design Phase 1: Prior Art Review',
        content: 'The first step was to analyze the successes and shortcomings of sonic interfaces that were already being utilized to actively control audio in virtual reality. After testing a variety of the forefront software and interviewing a collection of music producers and game designers, I learned that the majority of these relied heavily on mapping 2D interactions to a 3D scheme and did not utilize the affordances VR had to offer.'
      },
      {
        type: 'text',
        title: 'Design Phase 2: Prototyping Beyond Skeumorphism',
        content: 'The first prototype was based on an outer space scene, revolving around objects fit with visual feedback of what was happening in Ableton. For example, rings around the planets labelled "Kick and Snare", "Hats", and "Guitars" would come into existence and vanish based on whether the player triggered their respective audio clips to play or pause. The large, central black hole orb was synced to grow in discrete intervals every measure, and every 8 measures would play an exploding animation and return to its original, smaller size to give the performer a sense of where in the music\'s temporal space they were. The animations on the intergalactic dancers also synced up to the beat of the song being played, which gave users visual feedback of the groove and made the space and project feel more fun and bright, granted their dancing was very genre specific.'
      },
      {
        type: 'video',
        content: 'https://www.youtube.com/watch?v=5ucxN-jtAyo'
      },
      {
        type: 'text',
        title: 'Design Phase 3: Embodiment through the Affordances of VR',
        content: 'Through user testing and my own research, I learned that this method was essentially a remapping of a 2D DJ interface in 3D. As such, I wanted to reapproach the interaction schema in a way where the music producer was not at all tied to the action of "point-and-click", which is essentially a more labor inducing mouse, and rather to have every trackable movement of their body control different parameters of a virtual synthesizer.'
      },
      {
        type: 'video',
        content: 'https://www.youtube.com/watch?v=IiTDK8TEyhQ'
      },
      {
        type: 'text',
        title: 'Design Phase 4: Improvements on Intuitive Control',
        content: 'The previous design schema allowed for a plethora of fine details to be controlled through small changes in body position, but it was not very intuitive to link each motion with exactly what parameter, especially without a graphical user interface. After conducting interviews with music producers, vocalists, and game designers, I realized that it would be more beneficial to focus in on designing a tool for vocalists. With earpiece microphones, they perform hands free and can use all of the affordances a standard VR headset has to offer without sacrificing their ability to perform musically.\n\nThis iteration included a variety of settings for vocal harmony generation based on the distance between the users\' controllers and their headset, the ability to control background tracks and tempo, and a screen that displays lyrics, editable in the Unity file.'
      },
      {
        type: 'video',
        content: 'https://www.youtube.com/watch?v=OYLVuafBDoE'
      },
      {
        type: 'text',
        title: 'Design Phase 5: Gestural Controls and Automatic Harmonization',
        content: 'After considering what level of control over vocal harmonies I wanted, I realized that it would be more user-friendly to automatically generate bulk chords, rather than to have individual note control. This adds the ability for more than 2 "musically correct" harmonies to be generated at a time by not trying each individual harmony with the 2 handheld controllers. It does eliminate the ability for a vocalist to sing one root note and actively improvise the harmonies, but the peace of mind and new access to mobility allows for other types of gestural controls to enter the space without inherently interfering with the vocal controls simultaneously.\n\nIn the current environment, I decided to simply control the enabling and disabling of these harmonies, as well as a few other sought after vocal effects (e.g. formant shifting), through simple body language gestures.'
      },
      {
        type: 'video',
        content: 'https://youtu.be/hquJ52XpiNU'
      },
      {
        type: 'text',
        title: 'Design Phase 6: Next Steps',
        content: 'After rigorous user testing, I have learned about the successes of my design (primarily translating meaningful gestures into functional audio controls) and the shortcomings (primarily an excess of menu diving and non-modular setup options), and have received a lot of feedback prompting me to redesign towards an advanced karaoke system. I am currently in the process of building a scanner that scrapes lyrics from Genius.com and pipes audio from Spotify and Youtube into a collaborative performance environment. In this space, the software will automatically match the key and tempo of audio effects to the songs being queued, and everyone will be able to manipulate their own voice freely.'
      }
    ],
    thumbnail: "/projects/space-jam.jpg",
    images: ["/projects/space-jam.jpg"],
    techStack: [
      { name: "VR", color: "#1CA0F2" },
      { name: "Unity", color: "#000000" },
      { name: "C#", color: "#178600" },
      { name: "Ableton Live", color: "#00CF3F" },
      { name: "visionOS", color: "#000000" }
    ],
    links: [
      { type: "demo", url: "https://youtu.be/L_9KwXF9G6g" },
      { type: "docs", url: "https://www.notion.so/VR-Vocal-Performance-Space-dffa59f27c6d4649b71c3bef6c298320" },
      { type: "demo", url: "https://www.youtube.com/watch?v=5ucxN-jtAyo" },
      { type: "demo", url: "https://www.youtube.com/watch?v=IiTDK8TEyhQ" },
      { type: "demo", url: "https://www.youtube.com/watch?v=OYLVuafBDoE" },
      { type: "demo", url: "https://youtu.be/hquJ52XpiNU" }
    ],
    featured: true,
    startDate: new Date('2020-09'),
    highlights: [
      "Real-time vocal harmonization with gesture controls",
      "Visual feedback synchronized with audio parameters",
      "Automatic key and tempo matching",
      "Body movement-based parameter control",
      "Collaborative performance environment",
      "Lyrics display and editing capabilities"
    ],
    category: ["VR", "Music", "Interactive", "Research"],
    backgroundText: "  ♪  ",
    backgroundFontSize: 15,
    backgroundSpacing: 35
  },
  {
    id: 'calicollector',
    title: "Calicollector: Scavenger VR Game",
    description: "A VR game that lets players explore a suburban home from the perspective of a house cat",
    thumbnail: "/projects/calicollector/outdoor-scene.jpg",
    images: [
      "/calicollector/caliaccessibility.jpeg",
      "/projects/calicollector/accessibility.jpg",
      "/projects/calicollector/character-movement.jpg",
      "/projects/calicollector/scene-management.jpg",
      "/projects/calicollector/scene-build-goals.jpg",
      "/projects/calicollector/three-scenes.jpg",
      "/projects/calicollector/onboarding-scene.jpg",
      "/projects/calicollector/outdoor-scene.jpg",
      "/projects/calicollector/indoor-scene.jpg",
      "/projects/calicollector/assets-1.jpg",
      "/projects/calicollector/assets-2.jpg"
    ],
    techStack: [
      { name: "Unity", color: "#000000" },
      { name: "VR", color: "#1CA0F2" },
      { name: "C#", color: "#178600" },
      { name: "Cinema 4D", color: "#011A6A" }
    ],
    content: [
      {
        type: 'text',
        title: 'Background',
        content: "This was my first completed VR game. I set out with a few of my friends collaborating virtually to use this as an experience to explore as many aspects of Virtual Reality design as possible in a compact package."
      },
      {
        type: 'text',
        title: 'Objective',
        content: "Create a scavenger hunt-based VR game that allows players to explore a suburban home from the perspective of a house cat."
      },
      {
        type: 'video',
        title: 'Demonstration',
        content: 'https://youtu.be/qELDojpi6ZI'
      },
      {
        type: 'text',
        title: 'Basic Interactions',
        content: "Basic interactions to navigate the world of Calicollector. There are also \"easter egg\" interactions, like a grabbable jetpack to allow faster outdoor exploration."
      },
      {
        type: 'image',
        content: "/calicollector/calibasicinteractions.jpeg"
      },
      {
        type: 'text',
        title: 'Accessibility Features',
        content: "Key accessibility features kept in mind while developing the game to make it as enjoyable and inclusive as possible for the widest audience of potential users."
      },
      {
        type: 'image',
        content: "/calicollector/caliaccessibility.jpeg"
      },
      {
        type: 'text',
        title: 'Controller Mappings',
        content: "Controller mappings for interactions."
      },
      {
        type: 'image',
        content: "/calicollector/calicharactermovement.jpeg"
      },
      {
        type: 'text',
        title: 'Scene Management',
        content: "Scene management to allow game progress to be continuous when switching scenes."
      },
      {
        type: 'image',
        content: "/calicollector/caliscenemanagement.jpeg"
      },
      {
        type: 'text',
        title: 'Environment Design Goals',
        content: "Key features emphasized when developing the game's three environments."
      },
      {
        type: 'image',
        content: "/calicollector/caliscenebuildgoals.jpeg"
      },
      {
        type: 'text',
        title: 'Game Environments',
        content: "In-game map visible in each environment."
      },
      {
        type: 'image',
        content: "/calicollector/calithreescenes.jpeg"
      },
      {
        type: 'text',
        title: 'Game Scenes',
        content: "The game features three main scenes:"
      },
      {
        type: 'image',
        content: "/calicollector/calionboardingscene.jpeg",
        caption: "Onboarding scene."
      },
      {
        type: 'image',
        content: "/calicollector/calioutdoorscene.jpeg",
        caption: "Outdoor scene."
      },
      {
        type: 'image',
        content: "/calicollector/caliindoorscene.jpeg",
        caption: "Indoor scene."
      },
      {
        type: 'text',
        title: 'UI and Player Identity',
        content: "Integration of visual UI and teammate's custom paws to give players a sense of identity."
      },
      {
        type: 'image',
        content: "/calicollector/caliassets1.jpeg"
      },
      {
        type: 'text',
        title: 'Collectible Assets',
        content: "Assets developed by teammates in Cinema 4D as collectibles."
      },
      {
        type: 'image',
        content: "/calicollector/caliassets2.jpeg"
      }
    ],
    links: [
      { type: "demo", url: "https://youtu.be/qELDojpi6ZI" }
    ],
    featured: true,
    startDate: new Date('2020-01'),
    endDate: new Date('2020-05'),
    highlights: [
      "First-person VR exploration game",
      "Multiple interactive environments",
      "Custom asset integration",
      "Accessibility-focused design",
      "Collaborative development"
    ],
    category: ["VR", "Game Design", "Unity"],
    backgroundText: "      ≽^•⩊•^≼      ",
    backgroundFontSize: 15,
    backgroundSpacing: 27
  },
  {
    id: 'panaudicon',
    backgroundText: "👁 👂 👁",
    // ... rest of Panaudicon data
  },
  // ... other projects with their custom background text
]; 