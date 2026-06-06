'use client'

import Image from 'next/image'
import { GlassCard } from '@/components/ui/GlassCard'

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
    <section ref={sectionRef} className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <GlassCard className="p-8 md:p-12">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-56 h-56 lg:w-72 lg:h-72 relative flex-shrink-0">
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
                  With a background spanning music, electrical engineering, and
                  interaction design, I create tools that enhance natural creativity
                  and enable new forms of expression.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  </div>
)
