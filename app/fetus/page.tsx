import type { Metadata } from 'next'
import Image from 'next/image'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'Fetal Size by Week · Ben Crystal',
  description: 'Fetal length by week of pregnancy, in centimeters and inches, with a fruit or vegetable of the same length.',
  robots: { index: false },
}

interface WeekRow {
  week: number
  cm: number
  item: string
  image: string // file in /public/fetus, without extension
}

// Weeks 12–26 are from the source chart; 5–11 and 27–30 are filled in from
// standard embryo/fetal growth references. Lengths switch from crown-rump to
// head-to-toe at week 20, which is why the numbers jump there.
const CROWN_RUMP: WeekRow[] = [
  { week: 5, cm: 0.2, item: 'Sesame seed', image: 'sesame' },
  { week: 6, cm: 0.5, item: 'Lentil', image: 'lentil' },
  { week: 7, cm: 1.0, item: 'Blueberry', image: 'blueberry' },
  { week: 8, cm: 1.6, item: 'Raspberry', image: 'raspberry' },
  { week: 9, cm: 2.3, item: 'Cherry', image: 'cherry' },
  { week: 10, cm: 3.1, item: 'Strawberry', image: 'strawberry' },
  { week: 11, cm: 4.1, item: 'Brussels sprout', image: 'brussels-sprout' },
  { week: 12, cm: 5.4, item: 'Lime', image: 'lime' },
  { week: 13, cm: 7.4, item: 'Lemon', image: 'lemon' },
  { week: 14, cm: 8.7, item: 'Navel orange', image: 'orange' },
  { week: 15, cm: 10.1, item: 'Grapefruit', image: 'grapefruit' },
  { week: 16, cm: 11.6, item: 'Avocado', image: 'avocado' },
  { week: 17, cm: 13, item: 'Pear', image: 'pear' },
  { week: 18, cm: 14.2, item: 'Sweet potato', image: 'sweet-potato' },
  { week: 19, cm: 15.3, item: 'Mango', image: 'mango' },
]

const HEAD_TO_TOE: WeekRow[] = [
  { week: 20, cm: 25.6, item: 'Large banana', image: 'banana' },
  { week: 21, cm: 26.7, item: 'Large carrot', image: 'carrot' },
  { week: 22, cm: 27.8, item: 'Papaya', image: 'papaya' },
  { week: 23, cm: 28.9, item: 'Ear of corn (in the husk)', image: 'corn' },
  { week: 24, cm: 30, item: 'Pineapple (with crown)', image: 'pineapple' },
  { week: 25, cm: 34.6, item: 'English cucumber', image: 'cucumber' },
  { week: 26, cm: 35.6, item: 'Bunch of scallions', image: 'scallion' },
  { week: 27, cm: 36.6, item: 'Rhubarb stalk', image: 'rhubarb' },
  { week: 28, cm: 37.6, item: 'Leek', image: 'leek' },
  { week: 29, cm: 38.6, item: 'Bunch of celery', image: 'celery' },
  { week: 30, cm: 39.9, item: 'Daikon radish', image: 'daikon' },
]

const ACCENT = '#57f1ff'
const CM_PER_INCH = 2.54

function SectionRow({ label, note }: { label: string; note: string }) {
  return (
    <tr className="border-b border-neutral-800 bg-neutral-950/50">
      <th colSpan={4} scope="colgroup" className="px-4 py-3 text-left">
        <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
          {label}
        </span>
        <span className="ml-3 text-xs font-normal text-neutral-400">{note}</span>
      </th>
    </tr>
  )
}

function Row({ row }: { row: WeekRow }) {
  return (
    <tr className="border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800 transition-colors">
      <td className="px-4 py-3 font-bold tabular-nums text-white whitespace-nowrap">
        {row.week} <span className="font-normal text-neutral-400">wk</span>
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-neutral-200 whitespace-nowrap">
        {row.cm.toFixed(1)} cm
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-neutral-200 whitespace-nowrap">
        {(row.cm / CM_PER_INCH).toFixed(1)} in
      </td>
      <td className="px-4 py-2 text-white">
        <span className="flex items-center gap-3">
          <Image
            src={`/fetus/${row.image}.jpg`}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
          {row.item}
        </span>
      </td>
    </tr>
  )
}

export default function FetusPage() {
  return (
    <main className="min-h-screen min-h-dvh bg-black relative">
      <Background />
      <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase text-white">
          Fetal Size
          <span style={{ color: ACCENT }}>.</span>
        </h1>
        <p className="mt-4 text-base text-neutral-300">
          Average length by week of pregnancy, with a fruit or vegetable of about the same length.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b border-neutral-800 text-xs uppercase tracking-[0.2em] text-white/60">
                <th scope="col" className="px-4 py-3 text-left font-bold">Week</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">cm</th>
                <th scope="col" className="px-4 py-3 text-right font-bold">Inches</th>
                <th scope="col" className="px-4 py-3 text-left font-bold">About as long as</th>
              </tr>
            </thead>
            <tbody>
              <SectionRow label="Crown to rump" note="weeks 5–19, legs not counted" />
              {CROWN_RUMP.map((row) => (
                <Row key={row.week} row={row} />
              ))}
              <SectionRow label="Head to toe" note="weeks 20–30" />
              {HEAD_TO_TOE.map((row) => (
                <Row key={row.week} row={row} />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-neutral-400">
          Lengths are averages; individual pregnancies vary. The jump at week 20 is the switch from
          crown-to-rump to head-to-toe measurement, not a growth spurt. Comparisons are approximate.
          Photos from Wikimedia Commons.
        </p>
      </div>
    </main>
  )
}
