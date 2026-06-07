'use client'

import Image from 'next/image'

const ACCENT = '#57f1ff'

/**
 * Collapsible about panel below the hero. Expands smoothly via max-height
 * transition; scroll-target ref forwarded from parent.
 */
export const HeroAbout = ({
  show,
  sectionRef,
}: {
  show: boolean
  sectionRef: React.RefObject<HTMLElement>
}) => (
  <div
    className={`transition-all duration-700 ease-out overflow-hidden ${
      show ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0'
    }`}
  >
    <section ref={sectionRef} className="border-b border-white/10 bg-black">
      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-4">
          <div className="relative aspect-square w-full max-w-xs">
            <Image
              src="/headshot.jpg"
              alt="Ben Crystal"
              fill
              sizes="(min-width: 1024px) 20rem, 80vw"
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="lg:col-span-8">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-6"
            style={{ color: ACCENT }}
          >
            About
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
            Brooklyn-based
            <br />
            creative technologist.
          </h2>
          <div className="space-y-5 text-zinc-300 leading-relaxed max-w-2xl">
            <p className="text-lg font-light">
              I blend engineering and creativity to build immersive experiences
              that bridge the physical and digital worlds.
            </p>
            <p className="text-lg font-light">
              With a background spanning music, electrical engineering, and
              interaction design, I create tools that enhance natural creativity
              and enable new forms of expression.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
)
