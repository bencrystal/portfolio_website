import { Project } from '../types/Project';

export const projects: Project[] = [
  {
    id: 'major-league-baseball',
    title: "Major League Baseball",
    description: "Creative Technologist developing immersive AR/VR experiences and mobile platforms for Major League Baseball's digital initiatives",
    content: [
      {
        type: 'text',
        title: 'Role Overview',
        content: "As Creative Technologist at Major League Baseball, I developed and provided technical and artistic consultation for cutting-edge XR experiences that brought fans closer to America's pastime. My work spanned mobile AR platforms, VR gaming experiences, and cross-platform integrations that reached thousands of users at flagship MLB events."
      },
      {
        type: 'text',
        title: 'MLB Next Mobile AR Platform',
        content: "Developed and provided technical and artistic consultation for the MLB Next mobile AR platform, reaching 10,000+ iOS/Android users at flagship events. This platform delivered real-time gameplay insights, on-demand AR content, and interactive 3D field visualizations that enhanced the live baseball experience for fans attending games.",
        buttons: [
          { text: "View MLB Next App", url: "https://www.mlb.com/apps/mlb-next" }
        ]
      },
      {
        type: 'text',
        title: 'VR Experience Optimization',
        content: "Optimized performance and user experience for MLB VR and Home Run Derby VR through cross-team collaboration. This involved fine-tuning gameplay mechanics, improving rendering performance, and ensuring seamless user interactions across multiple VR platforms including Meta Quest and Steam VR.",
        buttons: [
          { text: "MLB VR (Meta Quest)", url: "https://www.meta.com/experiences/mlb/2873640696088444/" },
          { text: "MLB (Apple Vision Pro)", url: "https://apps.apple.com/us/app/mlb/id493619333?platform=vision" },
          { text: "Home Run Derby VR", url: "https://www.mlb.com/apps/home-run-derby-vr" }
        ]
      },
      {
        type: 'text',
        title: 'Cross-Platform XR Development',
        content: "Implemented cross-platform XR experiences integrating physical computing and custom hardware interfaces. These projects bridged the gap between digital experiences and physical baseball environments, creating innovative ways for fans to interact with live game data and statistics."
      },
      {
        type: 'text',
        title: 'Industry Collaboration',
        content: "Collaborated with stakeholders from Google, Unity, and T-Mobile on in-production AR experiences. This cross-industry partnership brought together cutting-edge technology partners to deliver world-class immersive experiences for MLB's diverse fanbase."
      },
      {
        type: 'text',
        title: 'Impact & Innovation',
        content: "My work at MLB represented a significant step forward in sports technology, demonstrating how immersive experiences can enhance fan engagement and bring new audiences to baseball. The platforms I helped develop reached thousands of users and set new standards for sports-related AR/VR applications."
      }
    ],
    thumbnail: "/projects/Major League Baseball/mlb-logo.svg",
    images: ["/projects/Major League Baseball/mlb-logo.svg"],
    techStack: [
      { name: "Unity", color: "#000000" },
      { name: "AR/VR", color: "#1CA0F2" },
      { name: "iOS", color: "#007AFF" },
      { name: "Android", color: "#3DDC84" },
      { name: "C#", color: "#178600" },
      { name: "Meta Quest", color: "#0467DF" },
      { name: "Apple Vision Pro", color: "#000000" },
      { name: "Cross-Platform", color: "#FF6B6B" }
    ],
    links: [],
    featured: true,
    startDate: new Date('2022-03'),
    endDate: new Date('2024-11'),
    highlights: [
      "MLB Next AR platform reaching 10,000+ users",
      "Cross-platform XR experience development",
      "MLB VR and Home Run Derby VR optimization",
      "Collaboration with Google, Unity, and T-Mobile",
      "Technical and artistic consultation role",
      "Physical computing and hardware integration",
      "iOS/Android mobile platform development",
      "Real-time gameplay insights and AR content"
    ],
    category: ["Flagship"],
    backgroundText: "⚾ 📱 🥽",
    backgroundFontSize: 16,
    backgroundSpacing: 30
  },
  // {
  //   id: 'interactive-background',
  //   title: 'Interactive Background',
  //   description: 'A responsive p5.js background with physics-based interactions',
  //   longDescription: 'A detailed exploration of creative coding using p5.js...',
  //   thumbnail: '/images/background-thumb.png',
  //   images: ['/images/background-full.png'],
  //   techStack: [
  //     { name: 'TypeScript', icon: 'typescript', color: '#007ACC' },
  //     { name: 'React', icon: 'react', color: '#61DAFB' },
  //     { name: 'p5.js', icon: 'p5js' }
  //   ],
  //   links: [
  //     { type: 'github', url: 'https://github.com/...' },
  //     { type: 'live', url: 'https://...' }
  //   ],
  //   featured: true,
  //   startDate: new Date('2024-01'),
  //   highlights: [
  //     'Physics-based interactions',
  //     'Optimized performance',
  //     'Mobile responsive'
  //   ],
  //   category: ['Web', 'Interactive'],
  //   backgroundText: "^ ◡ ^",
  //   backgroundFontSize: 8
  // },
  {
    id: 'space-jam-vr',
    title: "Virtual Audio Workstation",
    description: "An immersive spatial computing environment for vocal performance and musical expression using eye tracking andgesture-controlled effects",
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
        title: 'Final Quest Iteration\n(Click for Masters Thesis Documentation)',
        content: 'https://youtu.be/L_9KwXF9G6g',
        url: '/projects/Space Jam/Ben Crystal - IDM Thesis.pdf'
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
      },
      {
        type: 'text',
        title: 'Outcome & Reflections',
        content: 'This multi-year research project has evolved through careful iteration and extensive user testing, generating valuable insights about embodied interaction in virtual environments. By reimagining how musicians and performers can engage with audio processing tools in three-dimensional space, Space Jam challenges conventional interfaces and explores more intuitive and expressive modes of sonic creation.\n\nThe project has significantly expanded my technical expertise in spatial audio, real-time DSP implementation, gesture recognition systems, and cross-platform VR development. Perhaps more importantly, it has deepened my understanding of how technology can enhance creative expression through thoughtful design that prioritizes human movement and natural interaction patterns.\n\nAs immersive technologies continue to evolve, the insights from Space Jam will inform future work in creating more embodied, intuitive tools for musical expression across different realities.'
      }
    ],
    thumbnail: "/projects/Space Jam/29.png",
    images: ["/projects/Space Jam/29.png"],
    techStack: [
      { name: "VR", color: "#1CA0F2" },
      { name: "Unity", color: "#000000" },
      { name: "C#", color: "#178600" },
      { name: "Ableton Live", color: "#00CF3F" },
      { name: "visionOS", color: "#000000" }
    ],
    links: [],
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
    category: ["Flagship"],
    backgroundText: "  ♪  ",
    backgroundFontSize: 15,
    backgroundSpacing: 35
  },
  {
    id: 'calicollector',
    title: "Calicollector: Scavenger VR Game",
    description: "A VR exploration game that invites players to experience environmental interaction through the unique perspective of a house cat, emphasizing accessibility and intuitive game design",
    thumbnail: "/projects/Calicollector Scavenger VR Game/FileCover-1.png",
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
        content: "This scavenger hunt-styled VR game is my first completed virtual experience. You play as Cali, a mother cat, and need to explore your house and backyard to find food and toys to entertain your kittens. This game was made in collaboration with four 3D modelers, while I developed the environment, physics, UX, and UI."
      },
      {
        type: 'download',
        title: "Download Game",
        content: "Click here to download the Oculus Quest compatible APK.",
        url: "https://www.dropbox.com/scl/fi/4ag6bf2mlanf0yw7xy9ri/Calicollector.apk?rlkey=4lfcnmajjnv0o5177h2j6kams&e=1&dl=0"
      },
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
        title: 'Core Features',
        content: "Basic interactions and accessibility were key priorities in development."
      },
      {
        type: 'image',
        content: "/calicollector/calibasicinteractions.jpeg",
        caption: "Core game interactions"
      },
      {
        type: 'image',
        content: "/calicollector/caliaccessibility.jpeg",
        caption: "Accessibility features"
      },
      {
        type: 'text',
        title: 'Environment Design',
        content: "The game features multiple carefully designed environments for exploration."
      },
      {
        type: 'image',
        content: "/calicollector/caliscenebuildgoals.jpeg",
        caption: "Environment design goals"
      },
      {
        type: 'image',
        content: "/calicollector/caliscenemanagement.jpeg",
        caption: "Scene management system"
      },
      {
        type: 'image',
        content: "/calicollector/calithreescenes.jpeg",
        caption: "Overview of game environments"
      },
      {
        type: 'text',
        title: 'Game Environments',
        content: "Players can explore three distinct areas:"
      },
      {
        type: 'image',
        content: "/calicollector/calionboardingscene.jpeg",
        caption: "Tutorial Area"
      },
      {
        type: 'image',
        content: "/calicollector/calioutdoorscene.jpeg",
        caption: "Outdoor Environment"
      },
      {
        type: 'image',
        content: "/calicollector/caliindoorscene.jpeg",
        caption: "Indoor Environment"
      },
      {
        type: 'text',
        title: 'Asset Design',
        content: "Custom assets and UI elements enhance the player experience."
      },
      {
        type: 'image',
        content: "/calicollector/caliassets1.jpeg",
        caption: "UI and player elements"
      },
      {
        type: 'image',
        content: "/calicollector/caliassets2.jpeg",
        caption: "Collectible items"
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
    category: ["Substantial"],
    backgroundText: "      ≽^•⩊•^≼      ",
    backgroundFontSize: 15,
    backgroundSpacing: 27
  },
  {
    id: 'panaudicon',
    title: "Panaudicon: The Audible Surveillance State",
    description: "An exploration of sound and surveillance in virtual reality, examining how audio technology shapes modern surveillance systems",
    thumbnail: "/projects/Panaudicon/Screen_Shot_2022-04-22_at_5.41.38_PM.png",
    content: [
      {
        type: 'video',
        title: 'Project Overview',
        content: 'https://youtu.be/cf3efmv-DIY'
      },
      {
        type: 'text',
        title: 'On the State of Audio Surveillance',
        content: "As technology evolves, it offers novel ways to improve our lives. However, in a rapidly evolving world, institutions of power use new technologies to perpetually monitor and create self-governing order in society. Michel Foucault introduced the infrastructural idea of the panopticon to represent a system in which all members are potentially under a constant state of surveillance. In this system, all individuals are capable of being observed by a large portion of other individuals at any given point in time, and by constantly being monitored, it inflicts a sense of obligation to follow the system's morals and expectations as to be viewed as a functioning member of said system. The name 'panopticon' essentially derives its roots from the idea of a constantly seen system, but this paper will investigate the motivations and infrastructure that is in place to create a 'panaudicon', where those within the system are under a constant state of being heard and influenced through the ambient sound of life."
      },
      {
        type: 'text',
        title: 'Sound as Information',
        content: "First we will open up a framework for how one can think about sound as a medium for information transfer. Don Ihde compares conscious observance visually and audibly. In the optical world, so long as there is light, all materialized objects can be defined by features like their shape, shininess, and motion. However in the auditory realm, their default state is often mute. The visual, observable state of a fly, for example, can be walking, flying, or remaining immobile. Immobility is a state relational to walking, flying, etc., just as mute is a state relational to the lack of sound an object can produce. However, this is not always at a visible level.\n\nIn daily life, we train our ears to become accustomed to and to recognize sounds as quickly as having heard them once to be able to ease our minds and make sense of our world more passively. Ihde references the differentiation between hearing a car and a truck drive by, as well as a story about hearing a snail shell crack and recognizing the same sound a few weeks later.\n\nDifferent objects make different sounds as well. Not only do different objects oscillate and reproduce sounds with different timbres when struck, but they also interact differently with their environment. Ihde references playing a game where one has to guess whether a box contains a die or a marble, and how the sounds produced by rolling, sliding, flopping, and bouncing are easily distinguishable even if the contained components are of the same material and relative size."
      },
      {
        type: 'text',
        title: 'Perception and Reality',
        content: "Ihde also discusses the idea of having difficulty syncing our audible and visual reality. For example, an ornithologist noted that many of his students could not tell the differences between several different types of warblers' calls until they were explicitly explained what to listen for, at which point the students' understanding of blame of why it was so difficult to distinguish shifted from the objects being too similar to the inadequate rigor of their prior observations.\n\nIn this way, as we live with an empirical understanding of the world and the mind is capable of vastly filling in the gaps between what we comprehend, it is possible that many learnt correlations between the physical and audible world are falsehoods. There are many adults who believe that the sound of a snap is caused by the friction between fingers rubbing together, rather than the crack of hitting the palm.\n\nJ.M. Heaton noted that one frequent case of the mind filling in understanding with sensory assumptions is that when individuals who are blind undergo a medical procedure to gain sight, \"at first colours are not localized in space and are seen in much the same way as we smell odours.\" (Ihde, 1976) The process of learning that previous notions about the world can be jarring, or even painful, whereas it is not an addition to one's understanding of the world but a massive reshaping. It was also noted in a few studies that not only did vision reshape their understanding of how things looked and fit together with their sonic conception of the world, but also that once they acquired sight, they began to shift from listening attentively omnidirectionally to being more forward-focused."
      },
      {
        type: 'text',
        title: 'The Evolution of Radio and Control',
        content: "The way one empirically experiences the world changes how they focus their attention. Unlike the cases above, the majority of the time, a paradigm shift in the purpose of a medium more often comes extrinsically than from oneself. Berland argues that radio began to take a backseat to and become a more passive form of media from the 1950s to the 1980s. Although music is viewed as a form of unity and universal language of sorts, college and private radio stations in the US were almost nonexistent until the 1960s, and began to take off globally in the late 1980s.\n\nThe 5 largest record labels in the US (appropriately named the \"Big 5\"), in combination with private advertising firms, could easily control massive portions of national and international radio media, as there simply weren't other options to listen to. This normalized a reality of radio-worthy \"good music\", and the \"reliable brands\" that supported the station, being enforced as a standard to be looked up to.\n\nPeople often think about what was capable of being on the radio as being a standard for \"good music\", but in a sense, this highly controlled environment was less of a utopian \"global village\", as McLuhan called the state of coexistence through widespread media, and rather as a form of global technological imperialism."
      },
      {
        type: 'text',
        title: 'Muzak and Social Control',
        content: "An additional example of audible establishments creating a sense of complacency in the listener is Muzak, which is the eponym for a wide variety of \"easy listening\" music. This company was one of the most affordable ways to bring high fidelity music to business and homes in over 20 countries, from 1934 even up until the 1990s.\n\nThe two primary audiences that this functional music applied to were customers/clients, and workers doing repetitive tasks. For businesses, there were channels that played soothing or stripped down covers of popular music, which was already \"little more than 'social cement', reinforcing existing social relations and power structures, and entertainment as containment… to communicate a sense of calm and predictability to the listening subject.\" Muzak shifted the focus of listening to music to creating an auditory environment that was \"socially acceptable and controllable within a disciplined setting\" (Husch, 1984).\n\nAdditionally, for workers, there were even some stations that would intentionally cycle through songs to increase worker output. Short playlist-like cycles would start with slow songs and gradually ramp up the speed to keep workers engaged without feeling jarring or making them realize they are tired. When discussing the Panopticon, Foucault talks about training and viewing bodies as machines in a factory setting, and in this sense, this particular Muzak channel was employed explicitly to \"facilitate productivity through economy and efficiency of movement and a controlled increase in the utility of the body.\" (Jones and Schumacher, 1992)"
      },
      {
        type: 'text',
        title: 'Modern Audio Surveillance',
        content: "It has become increasingly common to be aware of the perpetually activated microphones in cell phones and smart speakers, ready to activate Apple's Siri or Amazon Alexa at any moment. These devices can eavesdrop to collect transcriptions and data based on who asks what and when. However, there is already a network of audio communications established throughout society that many are unaware of, as they transmit information at an ultrasonic frequency. \"There could be a signal coming through that television that's ultrasonic or near ultrasonic in most cases, that you can't hear. That sound can be picked up by your microphone, processed by the app, and then communicate with a server on the internet so that advertisers can gain data about what you're watching and potentially where you are.\" (Taylor, 2018)\n\nInformation at this frequency range is imperceivable by the human ear, and is being used in all sorts of public spaces to incentivize buyers, provide services, and data mine. A company called Shopkick created an app that can be used to let stores know what clothing people are stopping in front of the most to tell what might be working about their textures or displays, even if people don't necessarily buy that particular item."
      },
      {
        type: 'text',
        title: 'The Future of Audio Privacy',
        content: "We are approaching the panaudicon-- entering an unprecedented era of ubiquitous audio surveillance, where the expectation will be that everything said and heard might be recorded, and people will act accordingly. Although some uses of ultrasonic tracking can have positive effects on society with ethical information transferring, the technology is often evolving faster than the morals and laws can keep up."
      },
      {
        type: 'text',
        title: 'References',
        content: "• Berland, Jody. 1993. \"Contradicting Media: Toward a Political Phenomenology of Listening,\" in Radiotext(e) (ed. Neil Strauss). New York: Semiotext(e), pp. 38-55.\n\n• Ihde, Don. 1976. \"The Auditory Dimension\" and \"The Shapes of Sound\" in Listening and Voice: A Phenomenology of Sound. Athens: Ohio University Press, pp. 49-71.\n\n• Jones and Schumacher. 1992. \"Muzak: On functional music and power,\" in Critical Studies in Mass Communication, pp. 156-169.\n\n• Taylor, Dallas. 2018. \"Ultrasonic Tracking\" (No. 41). In Twenty Thousand Hertz. Defacto Sound.\n\n• Leppert, Richard. 2004. \"The Social Discipline of Listening,\" in Aural Cultures (ed. Jim Drobnick). Toronto: YYZ Books, pp. 19-35.\n\n• Foucault, Michael. 1977. \"Panopticism,\" in Discipline & Punish, pp. 195-230."
      }
    ],
    techStack: [
      { name: "Unity", color: "#000000" },
      { name: "C#", color: "#178600" },
      { name: "Audio DSP", color: "#FF0000" },
      { name: "Research", color: "#9C27B0" }
    ],
    links: [
      { type: "github", url: "https://github.com/bencrystal/panaudicon" }
    ],
    featured: true,
    startDate: new Date('2023-01'),
    highlights: [
      "Research on audio surveillance systems",
      "Analysis of ultrasonic tracking",
      "Investigation of privacy implications",
      "Study of audio-based monitoring",
      "Historical analysis of audio control systems"
    ],
    category: ["Substantial"],
    backgroundText: "👁 👂 👁",
    backgroundFontSize: 15,
    backgroundSpacing: 30
  },
  {
    id: 'wrip-watch',
    title: "Wrip Watch Branding",
    description: "Brand identity design for a conceptual wearable MIDI controller that transforms movement into musical expression",
    content: [
      {
        type: 'text',
        title: 'Background',
        content: "I've always been fascinated by the intersection of physical movement, wearable technology, and sound design. This project emerged from my desire to conceptualize how musicians might control sonic parameters through natural gestures. While I had created various experimental interfaces, I had yet to develop a cohesive brand narrative around these innovations. The Wrip Watch project became my canvas for exploring how to position a wearable MIDI controller within the professional music production ecosystem."
      },
      {
        type: 'text',
        title: 'Objective',
        content: "Create a distinct brand identity representing the wrip watch."
      },
      {
        type: 'text',
        title: 'Design Phase 1: Brand Strategy & Visual Language',
        content: "The first phase involved researching the competitive landscape, identifying audience segments, and developing a strategic framework for the brand positioning. I created comprehensive mood boards to define the visual language and tonal attributes that would differentiate Wrip in the market."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/1_wrip_brand_hi_res-16.jpeg",
        caption: "3 DOF Motion-to-MIDI mapping concept showing how physical gestures translate to parameter control during live performance."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/2_wrip_brand_hi_res-17.jpeg",
        caption: "Brand positioning and color palette derived from audio visualization principles and electronic music culture."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/3_wrip_brand_hi_res-21.jpeg",
        caption: "Audience-focused mood board targeting electronic musicians, performance artists, and live production professionals."
      },
      {
        type: 'text',
        title: 'Design Phase 2: Logo Development & Iteration',
        content: "The logo development process was methodical and iterative, beginning with conceptual sketches that explored various visual metaphors for musical control, motion, and wearable technology. After generating numerous concepts, I refined selected directions through multiple iterations, focusing on geometric precision, scalability, and recognition."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/4_wrip_brand_hi_res-20.jpeg",
        caption: "Initial thumbnail concept sketches exploring visual metaphors including oscillation patterns, waveforms, and gestural representations."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/5_wrip_brand_planning-18.jpeg",
        caption: "Logo evolution showing progressive refinement through systematic iterations and user feedback integration."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/6_wrip_brand_hi_res-19.jpeg",
        caption: "Final logomark variants with color applications optimized for different media contexts and user touchpoints."
      },
      {
        type: 'text',
        title: 'Design Phase 3: Public Interfaces',
        content: "The following display how the public would interact with the brand via custom letterheads and a custom website."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/7_wrip_stationary_system-22.jpeg",
        caption: "Corporate identity system including business cards with conductive ink elements and custom envelope designs."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/8_wrip_letterheads-18.jpeg",
        caption: "Letterheads."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/9_wrip_brand_hi_res-23.jpeg",
        caption: "Website homepage."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/10_wrip_brand_hi_res-24.jpeg",
        caption: "Website product sales page."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/11_wrip_brand_hi_res-25.jpeg",
        caption: "Website support page."
      },
      {
        type: 'image',
        content: "/projects/wrip Watch Branding/12_wrip_website_new_text-26.jpeg",
        caption: "Mobile layouts."
      }
    ],
    thumbnail: "/projects/wrip Watch Branding/wrip_cover-14.png",
    images: [
      "/projects/wrip Watch Branding/wrip_cover-14.png",
      "/projects/wrip Watch Branding/1_wrip_brand_hi_res-16.jpeg",
      "/projects/wrip Watch Branding/2_wrip_brand_hi_res-17.jpeg"
    ],
    techStack: [
      { name: "Figma", color: "#F24E1E" },
      { name: "Adobe Illustrator", color: "#FF9A00" },
      { name: "Adobe Photoshop", color: "#31A8FF" },
      { name: "UI/UX", color: "#4353FF" },
      { name: "Brand Strategy", color: "#9C27B0" }
    ],
    links: [],
    featured: false,
    startDate: new Date('2021-01'),
    endDate: new Date('2021-04'),
    highlights: [
      "Complete brand identity system",
      "Marketing and promotional materials",
      "Product packaging design",
      "Website and digital presence",
      "Brand guidelines documentation"
    ],
    category: ["Substantial"],
    backgroundText: "⌚ ♫ ⌚",
    backgroundFontSize: 15,
    backgroundSpacing: 30
  },
  {
    id: 'vocal-harmonizer',
    title: "Vocal Harmonizer",
    description: "A compact vocal harmonization system enabling musicians to create multi-layered vocal harmonies in real-time during performances",
    content: [
      {
        type: 'text',
        title: 'Background',
        content: "Vocal harmonies are a highly sought after effect in the music industry. There is currently no commercially ready method that allows solo-artists to self-harmonize in real time. The goal was to create a method for all vocalists to be able to play their voice as a variety of chords using an interface that is both intuitive and non-intrusive in a live performance setting."
      },
      {
        type: 'text',
        title: 'Objective',
        content: "Create a compact vocal harmonization pedal that allowed singers deliberate control over without limiting stage presence."
      },
      {
        type: 'text',
        title: 'Design Phase 1: Concept Generation and Wireframing',
        content: 'After interviewing dozens of industry professionals and musicians, I led three teammates in the creation of a competitive analysis using a "House of Quality". Using the tradeoffs and market gaps found, we designed preliminary sketches of different ways the system could function and evaluated them accordingly.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/house_of_quality-27.jpg',
        caption: 'Competitive analysis and market research using House of Quality methodology to identify design requirements and tradeoffs.'
      },
      {
        type: 'text',
        content: 'From this analysis, we developed six distinct concept approaches:'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-09.png',
        caption: '"All-in-one" approach, where reading the user\'s chord input and processing the audio would be completed on the same microcontroller held by the performer.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-06.png',
        caption: 'This design consists of an entirely software-based approach. It would have the cheapest reproduction cost, but offered the least mobility and freedom to the performer.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-07.png',
        caption: 'This concept employed the ability for performers to control the chords played from the microphone itself, not limiting their range of use to being near a computer to add effects to their vocals.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-08.png',
        caption: 'This concept introduced the idea of a "frequency modulation box" (FMB), eliminating the risks associated with bringing a computer to a performance. For this idea, the process of audio manipulation would be completed using only standalone devices.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-11.png',
        caption: 'My team and I valued the benefits of the "all-in-one" approach over any of the other options, and this sketch was my primary depiction of this device. It would wrap around nearly all stage microphones using a Velcro strap and a hinge attaching the microcontrollers to the buttons for different shapes, sizes, and angles of microphone handles.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_sketches-12.png',
        caption: 'After evaluating our budget and time constraints, the team decided to utilize a disjointed approach. This allows the musician to maintain full mobility around a stage without interacting directly with a computer, while still providing room in the controller for a larger battery, circuit board, and ergonomic flexibility.'
      },
      {
        type: 'text',
        title: 'Design Phase 2: Prototyping',
        content: 'This flow chart depicts each step that the audio signal goes through during its conversion into a restructured chord.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_dsp_long-30.jpg',
        caption: 'Complete signal flow chart showing each step of audio processing from input to harmonized output.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_electronics-28.jpg',
        caption: 'As can be seen in the final sketch above, we had to create the FMB to alter the audio to a desired chord structure, as well as a remote to chose said structure.\n\nWe opted to use a Raspberry Pi 3B+ with a high fidelity hat as the FMB.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_electronics-29.jpg',
        caption: 'I created a custom PCB for an ESP32 microcontroller in the remote to be able to communicate with the FMB via Bluetooth.\n\nThe PCB connected the microcontroller to four buttons representing 16 combinations, a power switch, a multi-functional LED, and an internal, rechargeable battery.'
      },
      {
        type: 'text',
        title: 'Design Phase 3: Final Controller Design and Spectral Analysis',
        content: 'The final phase focused on validating our design through spectral analysis and confirming that our theoretical models matched real-world performance.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synth_hardware-31.jpg',
        caption: 'Completed vocal harmonizer system showing final controller design and FMB integration.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/vocal_synthesizer_16ChordOverlay.png',
        caption: 'An overlay displays the idealized output that should be generated by the instrument when a user selects each chord given an input frequency of 500 Hz.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/NOVERLAY3.png',
        caption: 'A spectrogram I designed of the actual results of each chord type produced from a recorded 500 Hz sine wave.'
      },
      {
        type: 'image',
        content: '/projects/Vocal Harmonizer/NOVERLAY5.png',
        caption: 'The idealized outputs and measured frequencies overlain, where one can see direct alignment.'
      }
    ],
    thumbnail: "/projects/Vocal Harmonizer/VocalSynthPic-02.png",
    images: [
      "/projects/Vocal Harmonizer/VocalSynthPic-02.png",
      "/projects/Vocal Harmonizer/vocal_synth_dsp_long-30.jpg",
      "/projects/Vocal Harmonizer/vocal_synth_hardware-31.jpg"
    ],
    techStack: [
      { name: "Electronics", color: "#00979D" },
      { name: "Raspberry Pi", color: "#C51A4A" },
      { name: "ESP32", color: "#E7352C" },
      { name: "DSP", color: "#FF9900" },
      { name: "PCB Design", color: "#E83E8C" }
    ],
    links: [
      { type: "github", url: "https://github.com/bencrystal/vocal-harmonizer" },
      { type: "demo", url: "https://youtu.be/example-video-id" }
    ],
    featured: true,
    startDate: new Date('2020-01'),
    endDate: new Date('2021-12'),
    highlights: [
      "Real-time vocal harmonization system",
      "Custom PCB design for compact controller",
      "Bluetooth communication between controller and processing unit",
      "16 distinct chord combinations",
      "Spectral analysis confirming theoretical models",
      "Team leadership and user research integration"
    ],
    category: ["Flagship"],
    backgroundText: "♪ ♫ ♬",
    backgroundFontSize: 18,
    backgroundSpacing: 25
  },
  {
    id: 'affectimer',
    title: "Affectimer: Holistic Productivity App",
    description: "A positive habit tracking app that rewards efficiency and meaningful device usage, moving beyond stress-inducing productivity techniques",
    content: [
      {
        type: 'text',
        title: 'Background',
        content: "The \"pomodoro timer\" technique of working in short, focused intervals in combination with app-specific time limits have been the two greatest innovations I've incorporated into my own personal workflow. However, they both center their effectiveness around inducing stress surrounding failure rather than relieving users around the success of reworking their priorities."
      },
      {
        type: 'text',
        title: 'Objective',
        content: "Create the UI for a habit tracking productivity app to keep track of efficiency and wasted time in a positive manner."
      },
      {
        type: 'text',
        title: 'Design Phase 1: Research and Concept Generation',
        content: "I've used a handful of tools for habit tracking, journaling, and focusing techniques. Many have significantly improved my quality of work and life, but I spent time looking through various apps, interfaces, and journaling techniques that I've used in the past to figure out what works best for me and what's been most successful for the general public. Additionally, I conducted a survey amongst my peers to figure out what the most enticing distractions were when working in an attempt to mitigate the negative features. I realized that the majority of people using social media were using one information stream as a gateway to getting lost in other information streams. With Instagram for example, many users had a fear of missing messages in that section, but once they already had the app open, it was then easy to get into the endlessness of feeds, lives, and stories. As such, I set off to design an app that not only incorporated positive reinforcement, but also accounted for the individual users' value in each section of information feed individually."
      },
      {
        type: 'image',
        title: 'Research Documentation',
        content: '/projects/Affectimer Holistic Productivity App/research_documentation.png',
        caption: 'Complete research documentation and design process showing user surveys, competitive analysis, and iterative design approach.'
      },
      {
        type: 'text',
        title: 'Design Phase 2: Prototyping',
        content: "From here, I iterated through a few designs in Figma to create an all-in-one productivity app. The goal was to reward users for reducing time wasted on social media applications, and to make the time that they do spend engaged with their mobile devices more meaningful."
      },
      {
        type: 'figma',
        title: 'Interactive Prototype',
        content: 'https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FEL0GKDIqkDPQoGaBcR8lBk%2FAnti-Pomodoro-Timer%3Fnode-id%3D0%253A1'
      },
      {
        type: 'text',
        title: 'Key Design Principles',
        content: "The app was designed around three core principles: positive reinforcement over punishment, individual customization of social media value, and meaningful engagement metrics. Rather than shaming users for time spent on devices, Affectimer celebrates productive achievements and helps users understand their own usage patterns in a constructive way."
      },
      {
        type: 'text',
        title: 'Research Insights',
        content: "Through peer surveys and user research, I discovered that traditional productivity apps often fail because they create anxiety around \"failure\" rather than celebrating small wins. Users reported feeling discouraged by pomodoro timers that made them feel guilty for breaks, and app limits that felt punitive. Affectimer addresses this by reframing productivity as a positive practice rather than a restriction."
      },
      {
        type: 'text',
        title: 'Outcome & Reflections',
        content: "This project represents a fundamental rethinking of how productivity apps approach user motivation. By focusing on positive psychology principles and user-centered research, Affectimer offers a more sustainable approach to digital wellness. The research phase revealed critical insights about social media usage patterns that informed a more nuanced design approach, moving beyond simple time limits to address the underlying psychological needs that drive distraction."
      }
    ],
    thumbnail: "/projects/Affectimer Holistic Productivity App/Affectimer_Logo.png",
    images: ["/projects/Affectimer Holistic Productivity App/Affectimer_Logo.png"],
    techStack: [
      { name: "Figma", color: "#F24E1E" },
      { name: "UI/UX", color: "#4353FF" },
      { name: "User Research", color: "#4ECDC4" },
      { name: "Product Design", color: "#FF6B6B" }
    ],
    links: [
      { type: "live", url: "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FEL0GKDIqkDPQoGaBcR8lBk%2FAnti-Pomodoro-Timer%3Fnode-id%3D0%253A1" },
      { type: "docs", url: "/projects/Affectimer Holistic Productivity App/research_documentation.png" }
    ],
    featured: true,
    startDate: new Date('2022-01'),
    endDate: new Date('2022-05'),
    highlights: [
      "User research on social media distraction patterns",
      "Anti-pomodoro timer concept development",
      "Positive reinforcement over stress-based productivity",
      "All-in-one productivity app design",
      "Individual social media value assessment"
    ],
    category: ["For Funsies"],
    backgroundText: " 📱 ✍️ 💆 ",
    backgroundFontSize: 16,
    backgroundSpacing: 28
  },
  {
    id: 'ml-series',
    title: "Machine Learning Series",
    description: "A collection of three machine learning projects exploring evolutionary algorithms, natural language processing, and audio classification techniques",
    content: [
      {
        type: 'text',
        title: 'Project Overview',
        content: "This series represents my exploration into different domains of machine learning, from computer vision and robotics to natural language processing and audio analysis. Each project tackles unique challenges and demonstrates different ML approaches and techniques."
      },
      {
        type: 'image',
        content: "/projects/machine_learning_title-13.png",
        caption: "Machine Learning Series - exploring computer vision, NLP, and audio processing"
      },
      {
        type: 'text',
        title: 'Project 1: Dexterous Tree',
        content: "The \"Dexterous Tree\" robot is a segmented pillar with a neural network that developed using evolutionary techniques to dodge objects in its environment when falling. This project explores how evolutionary algorithms can train neural networks for dynamic obstacle avoidance and adaptive movement in robotic systems."
      },
      {
        type: 'image',
        content: "/projects/Dexterous Tree/fling2.png",
        caption: "Click to view documentation\n\nDexterous manipulation system demonstrating advanced robotic interaction capabilities.",
        url: '/projects/dexterous-tree'
      },
      {
        type: 'text',
        title: 'Project 2: Sound Classification',
        content: "This sound classification algorithm utilizes a convolutional neural network to distinguish the source and environment of sampled audio clips. The system demonstrates the application of deep learning to acoustic pattern recognition, enabling automatic identification and categorization of different audio signals based on their contextual characteristics."
      },
      {
        type: 'image',
        content: "/projects/Sound Classification/cnnarchtest1-05.png",
        caption: "Click to view documentation\n\nCNN architecture design for audio classification showing feature extraction and classification layers",
        url: '/projects/sound-classification'
      },
      {
        type: 'text',
        title: 'Project 3: Lyric Generation (GAN)',
        content: "A natural language processing project that uses bidirectional LSTMs to learn an artist's style from their most popular work and reproduce a new set of lyrics for the user. This system analyzes patterns in creative writing and generates coherent, stylistically consistent text that mimics the learned artistic style."
      },
      {
        type: 'image',
        content: "/projects/Lyric Generation/outputperepoch.png",
        caption: "Click to view documentation\n\nTraining progression showing output quality improvement across epochs in the lyric generation GAN",
        url: '/projects/lyric-generation'
      },
      {
        type: 'text',
        title: 'Technical Approach',
        content: "Each project represents a different branch of machine learning: computer vision for robotic manipulation, generative models for creative content, and signal processing for audio classification. Together, they demonstrate the versatility and wide-ranging applications of modern ML techniques."
      },
      {
        type: 'text',
        title: 'Key Learning Outcomes',
        content: "This series provided hands-on experience with multiple ML frameworks, data preprocessing techniques, model architecture design, and performance optimization. The projects also highlighted the importance of domain-specific considerations when applying machine learning to real-world problems."
      }
    ],
    thumbnail: "/projects/machine_learning_title-13.png",
    images: [
      "/projects/machine_learning_title-13.png",
      "/projects/Dexterous Tree/fling2.png",
      "/projects/Lyric Generation/outputperepoch.png",
      "/projects/Sound Classification/cnnarchtest1-05.png"
    ],
    techStack: [
      { name: "Python", color: "#3776AB" },
      { name: "TensorFlow", color: "#FF6F00" },
      { name: "PyTorch", color: "#EE4C2C" },
      { name: "Computer Vision", color: "#00D2FF" },
      { name: "NLP", color: "#4CAF50" },
      { name: "Audio Processing", color: "#9C27B0" },
      { name: "GANs", color: "#FF5722" },
      { name: "CNNs", color: "#2196F3" }
    ],
    links: [
      { type: "github", url: "https://github.com/bencrystal/ml-series" }
    ],
    featured: true,
    startDate: new Date('2021-09'),
    endDate: new Date('2022-05'),
    highlights: [
      "Three distinct ML domains explored",
      "Computer vision for robotic manipulation",
      "GAN-based creative text generation",
      "Audio classification using CNNs",
      "Cross-domain ML technique comparison",
      "End-to-end project development"
    ],
    category: ["Substantial"],
    backgroundText: "🤖 📊 🧠",
    backgroundFontSize: 16,
    backgroundSpacing: 30
  },
  {
    id: 'dexterous-tree',
    title: "Dexterous Tree",
    description: "A segmented pillar robot with neural networks developed using evolutionary techniques for dynamic obstacle avoidance",
    content: [
      {
        type: 'text',
        title: 'Project Overview',
        content: "The \"Dexterous Tree\" robot is a segmented pillar with a neural network that developed using evolutionary techniques to dodge objects in its environment when falling. This project explores how evolutionary algorithms can train neural networks for dynamic obstacle avoidance and adaptive movement in robotic systems."
      },
      {
        type: 'download',
        title: 'Project Documentation',
        content: 'Download detailed documentation for the Dexterous Tree project',
        url: '/projects/Dexterous Tree/Dexterous_Tree_Documentation.pdf'
      }
    ],
    thumbnail: "/projects/Dexterous Tree/fling2.png",
    images: ["/projects/Dexterous Tree/fling2.png"],
    techStack: [
      { name: "Python", color: "#3776AB" },
      { name: "Evolutionary Algorithms", color: "#FF5722" },
      { name: "Neural Networks", color: "#4CAF50" },
      { name: "Computer Vision", color: "#00D2FF" },
      { name: "Robotics", color: "#9C27B0" }
    ],
    links: [
      { type: "docs", url: "/projects/Dexterous Tree/Dexterous_Tree_Documentation.pdf" }
    ],
    featured: false,
    startDate: new Date('2021-09'),
    endDate: new Date('2022-01'),
    highlights: [
      "Evolutionary neural network training",
      "Dynamic obstacle avoidance",
      "Segmented robotic design",
      "Real-time adaptive movement"
    ],
    category: ["Machine Learning", "Robotics", "Computer Vision"],
    backgroundText: "🤖 🌳 📊",
    backgroundFontSize: 16,
    backgroundSpacing: 30
  },
  {
    id: 'sound-classification',
    title: "Sound Classification",
    description: "CNN-based audio classification system for distinguishing sound sources and environments",
    content: [
      {
        type: 'text',
        title: 'Project Overview',
        content: "This sound classification algorithm utilizes a convolutional neural network to distinguish the source and environment of sampled audio clips. The system demonstrates the application of deep learning to acoustic pattern recognition, enabling automatic identification and categorization of different audio signals based on their contextual characteristics."
      },
      {
        type: 'download',
        title: 'Project Documentation',
        content: 'Download detailed documentation for the Sound Classification project',
        url: '/projects/Sound Classification/SoundClassificationDocumentation.pdf'
      }
    ],
    thumbnail: "/projects/Sound Classification/cnnarchtest1-05.png",
    images: ["/projects/Sound Classification/cnnarchtest1-05.png"],
    techStack: [
      { name: "Python", color: "#3776AB" },
      { name: "TensorFlow", color: "#FF6F00" },
      { name: "CNNs", color: "#2196F3" },
      { name: "Audio Processing", color: "#9C27B0" },
      { name: "Signal Processing", color: "#FF5722" }
    ],
    links: [
      { type: "docs", url: "/projects/Sound Classification/SoundClassificationDocumentation.pdf" }
    ],
    featured: false,
    startDate: new Date('2021-11'),
    endDate: new Date('2022-03'),
    highlights: [
      "CNN architecture for audio",
      "Source and environment classification",
      "Feature extraction layers",
      "Real-time audio processing"
    ],
    category: ["Machine Learning", "Audio", "Deep Learning"],
    backgroundText: "🔊 📊 🧠",
    backgroundFontSize: 16,
    backgroundSpacing: 30
  },
  {
    id: 'lyric-generation',
    title: "Lyric Generation",
    description: "Bidirectional LSTM system for learning artist styles and generating original lyrics",
    content: [
      {
        type: 'text',
        title: 'Project Overview',
        content: "A natural language processing project that uses bidirectional LSTMs to learn an artist's style from their most popular work and reproduce a new set of lyrics for the user. This system analyzes patterns in creative writing and generates coherent, stylistically consistent text that mimics the learned artistic style."
      },
      {
        type: 'download',
        title: 'Project Documentation',
        content: 'Download detailed documentation for the Lyric GAN project',
        url: '/projects/Lyric Generation/Lyric_GAN_Documentation.pdf'
      }
    ],
    thumbnail: "/projects/Lyric Generation/outputperepoch.png",
    images: ["/projects/Lyric Generation/outputperepoch.png"],
    techStack: [
      { name: "Python", color: "#3776AB" },
      { name: "PyTorch", color: "#EE4C2C" },
      { name: "LSTMs", color: "#4CAF50" },
      { name: "NLP", color: "#2196F3" },
      { name: "Text Generation", color: "#FF5722" }
    ],
    links: [
      { type: "docs", url: "/projects/Lyric Generation/Lyric_GAN_Documentation.pdf" }
    ],
    featured: false,
    startDate: new Date('2022-01'),
    endDate: new Date('2022-05'),
    highlights: [
      "Bidirectional LSTM architecture",
      "Artist style learning",
      "Creative text generation",
      "Pattern recognition in lyrics"
    ],
    category: ["Machine Learning", "NLP", "Text Generation"],
    backgroundText: "🎵 📝 🧠",
    backgroundFontSize: 16,
    backgroundSpacing: 30
  }
]; 