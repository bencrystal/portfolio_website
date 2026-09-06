// Shared fake data for the three /practice redesign mockups. Deleted once a
// direction is chosen and the real page is rebuilt.

export type MockEx = {
  id: string;
  name: string;
  instrument: string | null;
  tools: { metronome: boolean; random_key: boolean; check_off: boolean };
  lastBpm: number | null;
  targetBpm: number | null;
  doneToday: boolean;
  todayLabel: string | null; // e.g. "6:12 · 104 bpm" or "✓"
  lastLabel: string; // e.g. "yesterday · 102 bpm"
  desc?: string;
};

export const MOCK_EXERCISES: MockEx[] = [
  {
    id: "warmup",
    name: "Starr's vocal warmup",
    instrument: "vocals",
    tools: { metronome: false, random_key: false, check_off: true },
    lastBpm: null,
    targetBpm: null,
    doneToday: true,
    todayLabel: "✓",
    lastLabel: "yesterday · ✓",
    desc: "Follow the video top to bottom. Sirens last.",
  },
  {
    id: "spider",
    name: "Spider crawl 1-2-3-4",
    instrument: "guitar",
    tools: { metronome: true, random_key: false, check_off: false },
    lastBpm: 104,
    targetBpm: 120,
    doneToday: true,
    todayLabel: "6:12 · 104 bpm",
    lastLabel: "yesterday · 102 bpm",
    desc: "All four fingers, one fret each. Keep the pinky curled.",
  },
  {
    id: "caged",
    name: "CAGED arpeggios",
    instrument: "guitar",
    tools: { metronome: true, random_key: true, check_off: false },
    lastBpm: 76,
    targetBpm: 100,
    doneToday: false,
    todayLabel: null,
    lastLabel: "2 days ago · 76 bpm",
    desc: "Random key every 8 beats. Name the shape out loud.",
  },
  {
    id: "changes",
    name: "Chord changes G↔C↔D",
    instrument: "guitar",
    tools: { metronome: true, random_key: false, check_off: false },
    lastBpm: 88,
    targetBpm: 112,
    doneToday: false,
    todayLabel: null,
    lastLabel: "yesterday · 88 bpm",
  },
  {
    id: "juggle",
    name: "Beat juggling drill",
    instrument: "dj",
    tools: { metronome: false, random_key: false, check_off: true },
    lastBpm: null,
    targetBpm: null,
    doneToday: false,
    todayLabel: null,
    lastLabel: "3 days ago · ✓",
  },
  {
    id: "ear",
    name: "Interval ear training",
    instrument: null,
    tools: { metronome: false, random_key: true, check_off: false },
    lastBpm: null,
    targetBpm: null,
    doneToday: false,
    todayLabel: null,
    lastLabel: "4 days ago · 5:00",
  },
];

export const MOCK_STATS = { streak: 5, todayMin: 9, doneCount: 2 };
