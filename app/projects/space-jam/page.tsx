'use client'

import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function SpaceJamPage() {
  console.log("Space Jam page loaded")
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-zinc-200">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-white">Space Jam: VR Vocal Performance Space</h1>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Background</h3>
          <p className="text-zinc-300">
            The majority of audio effects are controlled primarily through two dimensional interfaces. 
            This limits both the functionality of a toolset as well as the embodied connection between 
            users living and acting in a 3D space.
          </p>
        </section>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Objective</h3>
          <p className="text-zinc-300">
            Explore a variety of interaction schema to control an audio landscape using the affordances of Virtual Reality.
          </p>
        </section>

        <section className="mb-12">
          <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Demo of Current Iteration</h3>
          <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden">
            <iframe
              src="https://www.youtube.com/embed/L_9KwXF9G6g"
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        </section>

        <div className="bg-cyan-500/10 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="text-2xl">💡</div>
            <a 
              href="https://www.notion.so/dffa59f27c6d4649b71c3bef6c298320?pvs=21"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              The written portion of my thesis can be found here!
            </a>
          </div>
        </div>

        {/* Design Phases */}
        <section className="space-y-12">
          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 1: Prior Art Review</h3>
            <p className="text-zinc-300">
              The first step was to analyze the successes and shortcomings of sonic interfaces that were already being 
              utilized to actively control audio in virtual reality. After testing a variety of the forefront software 
              and interviewing a collection of music producers and game designers, I learned that the majority of these 
              relied heavily on mapping 2D interactions to a 3D scheme and did not utilize the affordances VR had to offer.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 2: Prototyping Beyond Skeumorphism</h3>
            <p className="text-zinc-300 mb-4">
              The first prototype was based on an outer space scene, revolving around objects fit with visual feedback 
              of what was happening in Ableton. For example, rings around the planets labelled "Kick and Snare", "Hats", 
              and "Guitars" would come into existence and vanish based on whether the player triggered their respective 
              audio clips to play or pause. The large, central black hole orb was synced to grow in discrete intervals 
              every measure, and every 8 measures would play an exploding animation and return to its original, smaller 
              size to give the performer a sense of where in the music's temporal space they were. The animations on the 
              intergalactic dancers also synced up to the beat of the song being played, which gave users visual feedback 
              of the groove and made the space and project feel more fun and bright, granted their dancing was very genre specific.
            </p>
            <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
              <iframe
                src="https://www.youtube.com/embed/5ucxN-jtAyo"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 3: Embodiment through the Affordances of VR</h3>
            <p className="text-zinc-300 mb-4">
              Through user testing and my own research, I learned that this method was essentially a remapping of a 2D DJ interface in 3D. 
              As such, I wanted to reapproach the interaction schema in a way where the music producer was not at all tied to the action 
              of "point-and-click", which is essentially a more labor inducing mouse, and rather to have every trackable movement of their 
              body control different parameters of a virtual synthesizer.
            </p>
            <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
              <iframe
                src="https://www.youtube.com/embed/IiTDK8TEyhQ"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 4: Improvements on Intuitive Control</h3>
            <p className="text-zinc-300 mb-4">
              The previous design schema allowed for a plethora of fine details to be controlled through small changes in body position, 
              but it was not very intuitive to link each motion with exactly what parameter, especially without a graphical user interface. 
              After conducting interviews with music producers, vocalists, and game designers, I realized that it would be more beneficial 
              to focus in on designing a tool for vocalists. With earpiece microphones, they perform hands free and can use all of the 
              affordances a standard VR headset has to offer without sacrificing their ability to perform musically.
            </p>
            <p className="text-zinc-300 mb-4">
              This iteration included a variety of settings for vocal harmony generation based on the distance between the users' controllers 
              and their headset, the ability to control background tracks and tempo, and a screen that displays lyrics, editable in the Unity file.
            </p>
            <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
              <iframe
                src="https://www.youtube.com/embed/OYLVuafBDoE"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 5: Gestural Controls and Automatic Harmonization</h3>
            <p className="text-zinc-300 mb-4">
              After considering what level of control over vocal harmonies I wanted, I realized that it would be more user-friendly to 
              automatically generate bulk chords, rather than to have individual note control. This adds the ability for more than 2 
              "musically correct" harmonies to be generated at a time by not trying each individual harmony with the 2 handheld controllers. 
              It does eliminate the ability for a vocalist to sing one root note and actively improvise the harmonies, but the peace of mind 
              and new access to mobility allows for other types of gestural controls to enter the space without inherently interfering with 
              the vocal controls simultaneously.
            </p>
            <p className="text-zinc-300 mb-4">
              In the current environment, I decided to simply control the enabling and disabling of these harmonies, as well as a few other 
              sought after vocal effects (e.g. formant shifting), through simple body language gestures.
            </p>
            <div className="aspect-video relative bg-zinc-800 rounded-lg overflow-hidden mb-8">
              <iframe
                src="https://www.youtube.com/embed/hquJ52XpiNU"
                className="absolute inset-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-4 text-cyan-400">Design Phase 6: Next Steps</h3>
            <p className="text-zinc-300">
              After rigorous user testing, I have learned about the successes of my design (primarily translating meaningful gestures into 
              functional audio controls) and the shortcomings (primarily an excess of menu diving and non-modular setup options), and have 
              received a lot of feedback prompting me to redesign towards an advanced karaoke system. I am currently in the process of 
              building a scanner that scrapes lyrics from <a href="http://Genius.com" className="text-cyan-400 hover:text-cyan-300">Genius.com</a> and 
              pipes audio from Spotify and Youtube into a collaborative performance environment. In this space, the software will automatically 
              match the key and tempo of audio effects to the songs being queued, and everyone will be able to manipulate their own voice freely.
            </p>
          </div>
        </section>

        <Button 
          variant="outline" 
          className="mt-8 hover:bg-blue-500 hover:text-white transition-colors backdrop-blur-sm bg-zinc-950/30"
          onClick={() => window.history.back()}
        >
          Back to Projects
        </Button>
      </div>
    </main>
  )
} 