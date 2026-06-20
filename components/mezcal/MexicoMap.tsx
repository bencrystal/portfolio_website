'use client'

import type { Mezcal } from '@/types/Mezcal'
import { MEXICO_PATH } from '@/data/mexicoOutline'

const TERRA = '#C06B4A'
const AGAVE = '#4A5D3A'
const SAND = '#CDBFA3'

interface MexicoMapProps {
  mezcals: Mezcal[]
  active: number
}

/**
 * Compact locator map. The Mexico silhouette is a single static path (painted
 * once), and only the active pin + floating label change as the flight rotates.
 * Coordinates live in the silhouette's native 0–1024 viewBox space.
 */
export function MexicoMap({ mezcals, active }: MexicoMapProps) {
  const current = mezcals[active]
  const pin = current?.coords

  return (
    <div className="relative w-full">
      <svg
        viewBox="-30 150 1090 760"
        className="h-auto w-full"
        role="img"
        aria-label={pin ? `Map of Mexico highlighting ${current.region}` : 'Map of Mexico'}
      >
        {/* Silhouette (static) */}
        <g transform="translate(0,1024) scale(0.1,-0.1)">
          <path d={MEXICO_PATH} fill={SAND} stroke="#B3A584" strokeWidth={6} />
        </g>

        {/* Inactive origin dots */}
        {mezcals.map((m, i) =>
          m.coords && i !== active ? (
            <circle
              key={m.id}
              cx={m.coords.x}
              cy={m.coords.y}
              r={9}
              fill={AGAVE}
              opacity={0.35}
            />
          ) : null,
        )}

        {/* Active pin + pulse (re-mounts on change to restart the ripple) */}
        {pin && (
          <g key={active}>
            <circle cx={pin.x} cy={pin.y} r={14} fill="none" stroke={TERRA} strokeWidth={4}>
              <animate attributeName="r" from="14" to="46" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.7" to="0" dur="1.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={pin.x} cy={pin.y} r={13} fill={TERRA} stroke="#F4EFE6" strokeWidth={4} />

            {/* Connector + floating label, anchored over the Pacific to the left */}
            <line x1={pin.x} y1={pin.y} x2={470} y2={690} stroke={TERRA} strokeWidth={3} />
            <g style={{ transition: 'opacity 0.5s ease' }}>
              <text
                x={460}
                y={672}
                textAnchor="end"
                fill={AGAVE}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 64, fontWeight: 600 }}
              >
                {current.name}
              </text>
              <text
                x={460}
                y={724}
                textAnchor="end"
                fill="#7C7259"
                style={{ fontSize: 34, letterSpacing: '0.04em' }}
              >
                {current.region}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  )
}
