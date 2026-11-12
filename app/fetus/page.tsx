import type { Metadata } from 'next'
import Image from 'next/image'
import Background from '@/components/Background'

export const metadata: Metadata = {
  title: 'Fetal Size by Week · Ben Crystal',
  description: 'Fetal length by week of pregnancy, in centimeters and inches, with a fruit or vegetable and an everyday object of the same length.',
  robots: { index: false },
}

interface WeekRow {
  week: number
  cm: number
  item: string
  image: string // file in /public/fetus, without extension
  object: string
  objectImage: string // file in /public/fetus/objects, without extension
}

// Weeks 12–26 are from the source chart; 5–11 and 27–30 are filled in from
// standard embryo/fetal growth references. Lengths switch from crown-rump to
// head-to-toe at week 20, which is why the numbers jump there.
const CROWN_RUMP: WeekRow[] = [
  { week: 5, cm: 0.2, item: 'Sesame seed', image: 'sesame', object: 'Pinhead', objectImage: 'pin' },
  { week: 6, cm: 0.5, item: 'Lentil', image: 'lentil', object: 'Pencil eraser', objectImage: 'eraser' },
  { week: 7, cm: 1.0, item: 'Blueberry', image: 'blueberry', object: 'Shirt button', objectImage: 'button' },
  { week: 8, cm: 1.6, item: 'Raspberry', image: 'raspberry', object: 'Marble', objectImage: 'marble' },
  { week: 9, cm: 2.3, item: 'Cherry', image: 'cherry', object: 'Quarter', objectImage: 'quarter' },
  { week: 10, cm: 3.1, item: 'Strawberry', image: 'strawberry', object: 'Paper clip', objectImage: 'paper-clip' },
  { week: 11, cm: 4.1, item: 'Brussels sprout', image: 'brussels-sprout', object: 'Golf ball', objectImage: 'golf-ball' },
  { week: 12, cm: 5.4, item: 'Lime', image: 'lime', object: 'AA battery', objectImage: 'aa-battery' },
  { week: 13, cm: 7.4, item: 'Lemon', image: 'lemon', object: 'Baseball', objectImage: 'baseball' },
  { week: 14, cm: 8.7, item: 'Navel orange', image: 'orange', object: 'Credit card', objectImage: 'credit-card' },
  { week: 15, cm: 10.1, item: 'Grapefruit', image: 'grapefruit', object: 'Computer mouse', objectImage: 'mouse' },
  { week: 16, cm: 11.6, item: 'Avocado', image: 'avocado', object: 'Can of soda', objectImage: 'soda-can' },
  { week: 17, cm: 13, item: 'Pear', image: 'pear', object: 'Index card (3×5)', objectImage: 'index-card' },
  { week: 18, cm: 14.2, item: 'Sweet potato', image: 'sweet-potato', object: 'Ballpoint pen', objectImage: 'pen' },
  { week: 19, cm: 15.3, item: 'Mango', image: 'mango', object: 'Dollar bill', objectImage: 'dollar-bill' },
]

const HEAD_TO_TOE: WeekRow[] = [
  { week: 20, cm: 25.6, item: 'Large banana', image: 'banana', object: 'Dinner plate', objectImage: 'plate' },
  { week: 21, cm: 26.7, item: 'Large carrot', image: 'carrot', object: 'Frisbee', objectImage: 'frisbee' },
  { week: 22, cm: 27.8, item: 'Papaya', image: 'papaya', object: 'Sheet of letter paper', objectImage: 'paper' },
  { week: 23, cm: 28.9, item: 'Ear of corn (in the husk)', image: 'corn', object: 'Football', objectImage: 'football' },
  { week: 24, cm: 30, item: 'Pineapple (with crown)', image: 'pineapple', object: '12-inch ruler', objectImage: 'ruler' },
  { week: 25, cm: 34.6, item: 'English cucumber', image: 'cucumber', object: 'Claw hammer', objectImage: 'hammer' },
  { week: 26, cm: 35.6, item: 'Bunch of scallions', image: 'scallion', object: 'Legal pad', objectImage: 'legal-pad' },
  { week: 27, cm: 36.6, item: 'Rhubarb stalk', image: 'rhubarb', object: 'Computer keyboard', objectImage: 'keyboard' },
  { week: 28, cm: 37.6, item: 'Leek', image: 'leek', object: '15-inch laptop', objectImage: 'laptop' },
  { week: 29, cm: 38.6, item: 'Bunch of celery', image: 'celery', object: 'Bowling pin', objectImage: 'bowling-pin' },
  { week: 30, cm: 39.9, item: 'Daikon radish', image: 'daikon', object: 'Drumstick', objectImage: 'drumstick' },
]

const ACCENT = '#57f1ff'
const CM_PER_INCH = 2.54

function SectionRow({ label, note }: { label: string; note: string }) {
  return (
    <tr className="border-b border-neutral-800 bg-neutral-950/50">
      <th colSpan={5} scope="colgroup" className="px-2 sm:px-4 py-3 text-left">
        <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
          {label}
        </span>
        <span className="ml-3 text-xs font-normal text-neutral-400">{note}</span>
      </th>
    </tr>
  )
}

function Comparison({ src, label }: { src: string; label: string }) {
  return (
    <td className="px-2 sm:px-4 py-2 align-top sm:align-middle text-xs sm:text-base text-white">
      <span className="flex flex-col items-start gap-1 sm:min-w-[9rem] sm:flex-row sm:items-center sm:gap-3">
        <Image
          src={src}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
        {label}
      </span>
    </td>
  )
}

function Row({ row }: { row: WeekRow }) {
  const inches = (row.cm / CM_PER_INCH).toFixed(1)
  return (
    <tr className="border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800 transition-colors">
      <td className="px-2 sm:px-4 py-3 font-bold tabular-nums text-white whitespace-nowrap">
        {row.week} <span className="font-normal text-neutral-400">wk</span>
      </td>
      <td className="px-2 sm:px-4 py-3 text-right tabular-nums text-neutral-200 whitespace-nowrap">
        {inches} in
        <span className="block text-neutral-400 sm:hidden">{row.cm.toFixed(1)} cm</span>
      </td>
      <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums text-neutral-200 whitespace-nowrap">
        {row.cm.toFixed(1)} cm
      </td>
      <Comparison src={`/fetus/${row.image}.jpg`} label={row.item} />
      <Comparison src={`/fetus/objects/${row.objectImage}.jpg`} label={row.object} />
    </tr>
  )
}

export default function FetusPage() {
  return (
    <main className="min-h-screen min-h-dvh bg-black relative">
      <Background />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-16">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase text-white">
          Fetal Size
          <span style={{ color: ACCENT }}>.</span>
        </h1>
        <p className="mt-4 text-base text-neutral-300">
          Average length by week of pregnancy, with a fruit or vegetable and an everyday object of about the same length.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b border-neutral-800 text-xs uppercase tracking-wider sm:tracking-[0.2em] text-white/60">
                <th scope="col" className="px-2 sm:px-4 py-3 text-left font-bold">Week</th>
                <th scope="col" className="px-2 sm:px-4 py-3 text-right font-bold">
                  <span className="sm:hidden">Length</span>
                  <span className="hidden sm:inline">Inches</span>
                </th>
                <th scope="col" className="hidden sm:table-cell px-4 py-3 text-right font-bold">cm</th>
                <th scope="col" className="px-2 sm:px-4 py-3 text-left font-bold">Fruit / veg</th>
                <th scope="col" className="px-2 sm:px-4 py-3 text-left font-bold">
                  <span className="sm:hidden">Object</span>
                  <span className="hidden sm:inline">Everyday object</span>
                </th>
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
