"use client";

import { useEffect, useState } from "react";

// The curated guitar plan: hand-assembled from two source videos (Jens
// Larsen's "Everything You Need To Learn For Jazz Guitar (In Order)" and Tomo
// Fujita on Playback Sessions). It replaces the AI-generated skill tree as the
// syllabus front door; the old tree stays reachable from the header link.
// Content is deliberately hardcoded — it's editorial, not data.

const TOKEN_KEY = "practice_token";
// Bench-test answers live on the device; it's a personal one-time diagnostic.
const BENCH_KEY = "practice_plan_bench_v1";

type Tools = { metronome?: boolean; random_key?: boolean; check_off?: boolean };
// refs: timestamped video moments. The first one becomes the spawned
// exercise's ref_url (so the card embeds the video at that moment); all of
// them are appended to the description and shown as chips on this page.
type Ref = { label: string; url: string };
type Spawn = { name: string; desc: string; tools: Tools; target?: number; refs: Ref[] };

// Chapter timestamps from the two videos' own descriptions.
const LARSEN = "https://youtu.be/EMQydbilqmo"; // Everything You Need To Learn For Jazz Guitar (In Order)
const FUJITA = "https://youtu.be/32ZbUVzeLG0"; // The Guitar Lesson Tomo Fujita Gives Every Student
const larsen = (mmss: string, t: number): Ref => ({ label: `Larsen ${mmss}`, url: `${LARSEN}?t=${t}` });
const fujita = (mmss: string, t: number): Ref => ({ label: `Fujita ${mmss}`, url: `${FUJITA}?t=${t}` });
// Larsen's companion PDF with the tabs for every example in the video.
// Always listed after a video ref so ref_url (refs[0]) stays embeddable.
const PDF: Ref = {
  label: "Larsen tabs",
  url: "https://mcusercontent.com/29585eaee49c1a06333528599/files/90a9c408-7fe0-6ba1-7847-4e0361d119e6/Everything_You_Need_To_Learn_For_Jazz_Guitar_In_Order_.pdf",
};

const CHECKS: { text: string; why: string }[] = [
  {
    text: "Major scale, one finger, one string, eyes off the neck — up and down at 60 bpm.",
    why: "Fujita's literal first question to every new student. It strips out shape memory and shows how you learned the instrument.",
  },
  {
    text: "Any major triad in all three inversions all over the neck — under 2.5 seconds each — plus the diatonic 7th arpeggios of C, one octave from each degree.",
    why: "Triads are the harmony under everything later. The diatonic arpeggios are the wire between the scale and the changes.",
  },
  {
    text: "Root–7–3 voicings for every seventh-chord type, both root-on-6 and root-on-5, played diatonically through a key without hunting.",
    why: "Three notes, fifth dropped. Fujita deliberately avoids the phrase \u201cshell chord\u201d — naming the shape lets you see it instead of hearing what's in it.",
  },
  {
    text: "Comp a whole standard — Satin Doll — with those voicings only, picking shapes so your hand barely moves.",
    why: "Exercises don't count. Can you get through a form and make the harmony flow?",
  },
  {
    text: "Listen back to your own solo: does the line push forward toward the next chord, or does it sit on each chord in turn?",
    why: "The Bach-and-bebop thing. If your recording sounds like correct notes parked over changes, this is the level.",
  },
  {
    text: "Solo a chorus of F blues with no backing track, and a listener can still hear the changes go by.",
    why: "The test for target notes: chord tones landing on the downbeat of the bar where the chord arrives.",
  },
  {
    text: "Chromatic approaches and enclosures appear on purpose, and you can say what degree you just played.",
    why: "Fujita: you can't be taught chromatic approach without chord tones, and you can't play outside if you can't play inside.",
  },
];

type Level = {
  num: string;
  title: string;
  time: string;
  intro: string;
  bullets: string[];
  fujita?: { title: string; body: string };
  specs: string[];
  gate: string;
  // Most levels are one exercise; some (L2) break into several separate
  // exercises under the one umbrella card.
  spawns: Spawn[];
};

const L0: Level = {
  num: "L0",
  title: "Make it hard to play",
  time: "half an hour, once — weeks 1–2 to live with it",
  intro:
    "Fujita spends the first couple of weeks here before touching a note of music. Reverb, mid-heavy warmth and a maxed volume knob all hide the exact things you need to hear. \u201cFirst you have to make it difficult to play. You don't want to make it easy to play.\u201d",
  bullets: [
    "Amp volume low but real — 2 on a Hot Rod Deluxe. Everything else up, bass at zero, treble all the way up.",
    "Reverb off. Not less — off. Pretend it doesn't exist, so dynamics have to come from your picking hand.",
    "Guitar volume at 8, never 10. At 10 there's nowhere to go.",
    "Get the guitar set up: pickup height (magnets pulling the strings kill sustain), string height and buzz, fresh strings. An expensive guitar with a bad setup is teaching you the wrong thing.",
    "Don't tap your foot. The extra sound isn't helping and your playing has to groove on its own.",
  ],
  fujita: {
    title: "Fujita's version",
    body: "Guitar and amp are one unit — so practise unplugged with the same picking you'd use amplified. If you hammer at an unplugged electric, you've stopped using dynamics entirely.",
  },
  specs: [],
  gate: "A single note sustains and sounds musical with nothing helping it. If it sounds thin, that's information about your hands, not the amp.",
  spawns: [
    {
      name: "L0 · Amp & guitar setup (no-reverb rule)",
      desc: "Amp volume low but real; bass 0, treble up. Reverb OFF. Guitar volume at 8, never 10. Setup: pickup height, string height, fresh strings. No foot tapping. Practise unplugged with the same picking you'd use amplified.\n\nGate: a single note sustains and sounds musical with nothing helping it.",
      tools: { check_off: true },
      refs: [fujita("8:32", 512), fujita("10:23", 623), fujita("28:38", 1718)],
    },
  ],
};

const LEVELS: Level[] = [
  {
    num: "01",
    title: "Skip the scale madness — one scale, actually known",
    time: "2–3 weeks",
    intro:
      "Not the pentatonic: the sound you associate with jazz doesn't come from it. Three scales cover most of the music — major, harmonic minor, melodic minor — and major is the one that makes the other six levels make sense. Don't take it through 12 keys and every position now; that's how people burn out before they've used it once.",
    bullets: [
      "One string, one finger, no looking. Up and down, then a second key.",
      "Learn it by intervals, not by shape. Say or sing the degree as you play it.",
      "Then in position — only enough to play melodies with, not to cover the neck.",
      "Leave time to actually play. Scales are not the practice session.",
    ],
    specs: ["60 bpm", "click on downbeats only", "2 keys", "10 min/day"],
    gate: "You can find any degree of the scale by ear before your hand arrives there.",
    spawns: [
      {
        name: "L1 · Scale on one string",
        desc: "One string, one finger, no looking — up and down, then a second key. Learn it by intervals, not shape: say or sing the degree as you play it. 60 bpm, click on downbeats only, 2 keys.",
        tools: { metronome: true },
        refs: [larsen("0:33", 33), fujita("1:21", 81), PDF],
      },
      {
        name: "L1 · Scale in position",
        desc: "The same scale in position — only enough to play melodies with, not to cover the neck. Keep saying or singing the degrees. Leave time to actually play; scales are not the practice session.\n\nGate: you can find any degree of the scale by ear before your hand arrives there.",
        tools: { metronome: true },
        refs: [larsen("0:33", 33), PDF],
      },
    ],
  },
  {
    num: "02",
    title: "The chords inside the scale",
    time: "3–4 weeks",
    intro:
      "The seventh chord is the basic unit of a jazz tune, so build the diatonic seventh-chord arpeggios out of the scale. This is the single most useful scale exercise in jazz — it's what connects the chords in the song to the notes you solo with. Build it in four passes rather than memorising shapes.",
    bullets: [
      "The scale itself.",
      "Diatonic thirds — the interval the arpeggios are made from.",
      "Stack two thirds: diatonic triads. All three inversions, across string sets, inside 2.5 seconds each.",
      "Stack one more: full diatonic 7th arpeggios, one octave from every degree.",
      "Then leave exercise-land: take a tune and arpeggiate each chord as it goes past, over and over. Start writing your own licks from these — several arpeggios work over the same chord, which is where the options come from.",
    ],
    specs: ["60 → 100 bpm", "1 octave only", "C, then F", "15 min/day"],
    gate: "You can arpeggiate a full chorus of a standard in time without stopping to work out what's next.",
    spawns: [
      {
        name: "L2 · The scale itself",
        desc: "Pass 1 of 4: the scale, up and down. 60→100 bpm, 1 octave only, C then F.",
        tools: { metronome: true },
        target: 100,
        refs: [larsen("1:38", 98), PDF],
      },
      {
        name: "L2 · Diatonic thirds",
        desc: "Pass 2 of 4: diatonic thirds — the interval the arpeggios are made from. 60→100 bpm, 1 octave only, C then F.",
        tools: { metronome: true },
        target: 100,
        refs: [larsen("1:38", 98), PDF],
      },
      {
        name: "L2 · Diatonic triads",
        desc: "Pass 3 of 4: stack two thirds — diatonic triads, all three inversions, across string sets, inside 2.5 seconds each. 60→100 bpm, C then F.",
        tools: { metronome: true },
        target: 100,
        refs: [larsen("1:38", 98), PDF],
      },
      {
        name: "L2 · Diatonic 7th arpeggios",
        desc: "Pass 4 of 4: full diatonic 7th arpeggios, one octave from every degree. 60→100 bpm, 1 octave only, C then F.",
        tools: { metronome: true },
        target: 100,
        refs: [larsen("1:38", 98), PDF],
      },
      {
        name: "L2 · Arpeggiate a tune",
        desc: "Leave exercise-land: take a tune and arpeggiate each chord as it goes past, over and over. Start writing your own licks from these — several arpeggios work over the same chord, which is where the options come from.\n\nGate: arpeggiate a full chorus of a standard in time without stopping.",
        tools: { metronome: true },
        refs: [larsen("1:38", 98), PDF],
      },
    ],
  },
  {
    num: "03",
    title: "Root, 7, 3 — and nothing more elaborate",
    time: "2 weeks (Fujita spends 4–5)",
    intro:
      "Rhythm and phrasing are almost impossible to learn while you're playing four and five notes at a time. Beginners burn months on hundreds of voicings and inversions without ever playing a song with them. Drop the fifth; two shapes cover every seventh chord.",
    bullets: [
      "Root on 6: root, then the 7th and 3rd above it on the middle strings.",
      "Root on 5: root, then the 3rd and 7th. Chord tones always on the middle string set, root always below.",
      "Both shapes for maj7, m7, dom7, m7\u266d5.",
      "Play the whole diatonic set of a key with root on 5, then again with root on 6.",
    ],
    fujita: {
      title: "Fujita's version",
      body: "He teaches this on Blue Monk, not as an exercise: melody twice at 60 bpm with the exact fingering, then fingerpicked root-7-3 underneath — and the real lesson is dynamics. When you go from single notes to chords you have to play softer to keep the volume level. Almost nobody does this without being told. He'll stay on it four or five weeks and refuse to move on.",
    },
    specs: ["fingerpicked, not strummed", "match volume single-note ↔ chord", "3 keys"],
    gate: "Any seventh chord, either root string, no hesitation, no looking down — and the chords sit at the same volume as your single notes.",
    spawns: [
      {
        name: "L3 · Root on 6",
        desc: "Root on 6: root, then the 7th and 3rd above it on the middle strings. All four qualities — maj7, m7, dom7, m7b5. Fingerpicked, not strummed.",
        tools: { metronome: true },
        refs: [larsen("3:56", 236), PDF],
      },
      {
        name: "L3 · Root on 5",
        desc: "Root on 5: root, then the 3rd and 7th. Chord tones always on the middle string set, root always below. All four qualities — maj7, m7, dom7, m7b5. Fingerpicked, not strummed.",
        tools: { metronome: true },
        refs: [larsen("3:56", 236), PDF],
      },
      {
        name: "L3 · Diatonic set, both root strings",
        desc: "Play the whole diatonic set of a key with root on 5, then again with root on 6. 3 keys.\n\nGate: any seventh chord, either root string, no hesitation, no looking down.",
        // random_key: the gate is "any chord, any key, no hesitation" — let
        // the key generator call them.
        tools: { metronome: true, random_key: true },
        refs: [larsen("3:56", 236), PDF],
      },
      {
        name: "L3 · Blue Monk at one volume",
        desc: "Fujita's vehicle for the same material: melody twice at 60 bpm with the exact fingering, then fingerpicked root-7-3 underneath. The real lesson is dynamics — chords played softer so they sit at the same volume as your single notes.",
        tools: { metronome: true },
        refs: [fujita("14:12", 852)],
      },
    ],
  },
  {
    num: "04",
    title: "Chords are for making music",
    time: "3 weeks",
    intro:
      "Voicings are useless until they carry a form. Connect the two sets into short progressions, then use the same logic to get through a tune with everything staying under your hand.",
    bullets: [
      "ii–V–I in C from Dm7 with root on 5 — G7 is right next to it, Cmaj7 right after.",
      "The same ii–V–I starting from Dm7 with root on 6.",
      "Satin Doll. It's in C but full of other ii–Vs: the ii–V in D is the C one moved up two frets; Am7–D7 sits on the 6th-string set, and A\u266dm7–D\u266d7 is that same shape a half step down, resolving to Cmaj7 with root on 5.",
      "Group chords that live together — that's what makes a tune memorable rather than memorised.",
    ],
    specs: ["3 tunes", "metronome on 2 and 4", "record every pass"],
    gate: "A full chorus without a chart, everything staying close on the neck, and the harmony sounds like it's going somewhere.",
    spawns: [
      {
        name: "L4 · ii–V–I in C, root on 5",
        desc: "ii–V–I in C from Dm7 with root on 5 — G7 is right next to it, Cmaj7 right after. Metronome on 2 and 4, record every pass.",
        tools: { metronome: true },
        refs: [larsen("6:07", 367), PDF],
      },
      {
        name: "L4 · ii–V–I in C, root on 6",
        desc: "The same ii–V–I starting from Dm7 with root on 6. Metronome on 2 and 4, record every pass.",
        tools: { metronome: true },
        refs: [larsen("6:07", 367), PDF],
      },
      {
        name: "L4 · Satin Doll",
        desc: "Satin Doll: in C but full of other ii–Vs — the ii–V in D is the C one moved up two frets; Am7–D7 sits on the 6th-string set; Abm7–Db7 is that shape a half step down, resolving to Cmaj7 root on 5. Group chords that live together — that's what makes a tune memorable rather than memorised. Metronome on 2 and 4, record every pass.\n\nGate: a full chorus without a chart, everything close on the neck, harmony going somewhere.",
        tools: { metronome: true },
        refs: [larsen("6:07", 367), PDF],
      },
    ],
  },
  {
    num: "05",
    title: "Hear the flow before you build it",
    time: "2 weeks, then ongoing",
    intro:
      "Right notes over each chord still sounds like separate notes over separate chords. What's missing is direction: lines moving toward strong chord tones on the downbeat, always pushing ahead — the reason people say bebop sounds like Bach. This level is ears, not fingers.",
    bullets: [
      "Listen to a lot of solos, specifically for where the line lands when the chord changes.",
      "Read through written jazz lines for the flow — the etudes in Joe Pass's Guitar Style are the recommended one.",
      "Record your own blues chorus and compare. Name the bar where your line stops going anywhere.",
    ],
    fujita: {
      title: "Fujita's version",
      body: "Learn language from records, not tab or video — copying visually gets you the result without the ear that produced it. Learn a phrase exactly as you heard it, in more than one position; writing it down is optional, hearing it is not.",
    },
    specs: [],
    gate: "You can point at a bar in someone's solo and say what it was aiming at.",
    spawns: [{
      name: "L5 · Listen for the line's direction",
      desc: "Listen to solos for where the line lands when the chord changes. Read written jazz lines for flow (Joe Pass, Guitar Style etudes). Record your own blues chorus and name the bar where your line stops going anywhere. Learn phrases from records, not tab — exactly as heard, in more than one position.\n\nGate: you can point at a bar in someone's solo and say what it was aiming at.",
      tools: { check_off: true },
      refs: [larsen("8:36", 516), fujita("33:30", 2010), PDF],
    }],
  },
  {
    num: "06",
    title: "Target notes — the method",
    time: "3–4 weeks",
    intro:
      "Take the notes of the chord you're on and build a melody that points at a note in the next chord. That's the whole trick, and it's learnable rather than magic.",
    bullets: [
      "F blues. F7 and B\u266d7 arpeggios, nothing else.",
      "The third makes a chord unmistakable, so for B\u266d7 that's D. That's your target.",
      "Build lines from F7 chord tones that resolve onto that D, landing on the downbeat where B\u266d7 arrives.",
      "Find many different ways to do it with only those four chord tones per chord before adding anything.",
    ],
    specs: ["4 chord tones only", "target on beat 1", "no backing track"],
    gate: "Played unaccompanied, someone else can hear the chord change happen.",
    spawns: [{
      name: "L6 · Target notes on F blues",
      desc: "F7 and Bb7 arpeggios, nothing else. The target is the 3rd of the next chord (D for Bb7): build lines from F7 chord tones that resolve onto it, landing on the downbeat where Bb7 arrives. Many ways with only four chord tones per chord before adding anything. No backing track.\n\nGate: played unaccompanied, someone else can hear the chord change happen.",
      tools: { metronome: true },
      refs: [larsen("10:35", 635), PDF],
    }],
  },
  {
    num: "07",
    title: "Jazz phrasing — and the outside",
    time: "open-ended",
    intro:
      "The first six levels are the foundation. These are the devices that turn correct notes into something that sounds like jazz — and they only work on top of everything above.",
    bullets: [
      "Different ways of running the arpeggios you already own.",
      "Chromatic passing notes; enclosures that surround the target from both sides; trills.",
      "Fujita's route outside: play everything with triads first, then approach a triad tone from a half step below, then from above, then resolve in. Chromatic approach is unteachable without chord tones.",
      "Transcribe someone who does it — Jim Hall, Pat Martino. Scofield's outside playing came out of transcribing Jim Hall and the blues players, not from shifting pentatonics by half steps.",
      "One-chord vamps with a deliberately small vocabulary. Pick an awkward key (F rather than E) so you can't fall into familiar shapes.",
    ],
    specs: [],
    gate: "You leave the harmony and come back on purpose, and it sounds intended rather than rescued.",
    spawns: [
      {
        name: "L7 · Arpeggio variations",
        desc: "Different ways of running the arpeggios you already own — direction changes, groupings, sequences.",
        tools: { metronome: true },
        refs: [larsen("11:59", 719), PDF],
      },
      {
        name: "L7 · Enclosures & passing notes",
        desc: "Chromatic passing notes; enclosures that surround the target from both sides; trills. Only on top of chord tones you can already hit.",
        tools: { metronome: true },
        refs: [larsen("11:59", 719), PDF],
      },
      {
        name: "L7 · Triad half-step approaches",
        desc: "Fujita's route outside: play everything with triads first, then approach a triad tone from a half step below, then from above, then resolve in. Chromatic approach is unteachable without chord tones.",
        tools: { metronome: true },
        refs: [fujita("31:00", 1860)],
      },
      {
        name: "L7 · Transcribe the outside",
        desc: "Transcribe someone who does it — Jim Hall, Pat Martino. Scofield's outside playing came out of transcribing Jim Hall and the blues players, not from shifting pentatonics by half steps. Learn it exactly as heard; writing it down is optional.",
        tools: { check_off: true },
        refs: [fujita("33:30", 2010)],
      },
      {
        name: "L7 · One-chord vamps",
        desc: "One-chord vamps with a deliberately small vocabulary. Pick an awkward key (F rather than E) so you can't fall into familiar shapes.\n\nGate: you leave the harmony and come back on purpose, and it sounds intended.",
        // random_key picks the awkward vamp key so you can't drift to E.
        tools: { metronome: true, random_key: true },
        refs: [fujita("38:42", 2322)],
      },
    ],
  },
];

const RAILS: { title: string; intro: string; bullets: string[]; spawn: Spawn }[] = [
  {
    title: "Rhythm",
    intro:
      "He's blunt that rhythm wasn't natural for him — a drummer told him at 14 that his time was bad and he went and built it. Do one item a day, rotating.",
    bullets: [
      "Metronome on downbeats. Then on 2 and 4. Then take it away entirely.",
      "Record the no-click version and listen hard to the tempo at the start versus the end. Don't chase perfect — bands speed up when they're excited — but know where you drift.",
      "Tap accents and move your body. If you can't tap a shuffle, the problem isn't the guitar.",
      "Play a bassline while singing a different melody over it. Listen to records for the bass and hi-hat, not the soloist.",
    ],
    spawn: {
      name: "Rail · Rhythm (one item a day)",
      desc: "Rotate: metronome on downbeats → on 2 and 4 → no click, recorded (compare start vs end tempo — know where you drift). Tap accents and move. Bassline while singing a different melody. Listen to records for the bass and hi-hat, not the soloist.",
      // check_off: it's one rotating item a day — tick it, don't chase bpm.
      tools: { metronome: true, check_off: true },
      refs: [fujita("23:00", 1380), fujita("25:50", 1550), fujita("27:30", 1650)],
    },
  },
  {
    title: "Picking, muting, dynamics",
    intro:
      "The foundation work Fujita gave John Mayer instead of licks — his reasoning being that fixing technique first leaves more room to grow later.",
    bullets: [
      "Chromatic scale, very slow, for smoothness. Strict alternate picking — random down-down-up is the thing to kill.",
      "Duets from a method book, played exactly as written, to clean up the picking hand.",
      "Left-hand muting: use fingers 2-3-4 so the first finger mutes and no stray harmonics ring.",
      "The reverb test: set a little reverb, then pick softly enough that it barely triggers. Then play loud enough to trigger it and allow yourself only two or three notes. That's the whole dynamic range drill.",
    ],
    spawn: {
      name: "Rail · Picking, muting, dynamics",
      desc: "Chromatic scale very slow, strict alternate picking (kill random down-down-up). Duets exactly as written. Left-hand muting with fingers 2-3-4 so the first finger mutes. Reverb test: pick softly enough it barely triggers, then loud enough to trigger it with only two or three notes.",
      tools: { metronome: true, check_off: true },
      refs: [fujita("48:10", 2890), fujita("52:32", 3152)],
    },
  },
];

const DAY: [string, string, string][] = [
  ["3", "Warm-up", "The previous level's exercise, from memory, eyes off the neck."],
  ["12", "Current level", "The one exercise for your level. One thing, done really well."],
  ["5", "A rail", "One rhythm item or one picking item. Rotate them."],
  ["5", "Play", "A tune, or a chorus of blues. Recorded. No stopping to fix things."],
];

const RULES: [string, string][] = [
  [
    "One thing, really well.",
    "Fujita's method in a sentence: he won't move to the next subject until the current one is got. Get a few things properly and the next ten come easier; get ten things half-way and all of them stay mediocre.",
  ],
  [
    "Ears before eyes.",
    "Tab and lesson videos let you reproduce a result without building what produced it. Use them to check a fingering, never to learn a line.",
  ],
  [
    "Record before you judge.",
    "Both sources use recording as the diagnostic. You can't hear your own time while you're keeping it.",
  ],
  [
    "Practising and playing are different modes.",
    "\u201cWhen you study you think; when you play, you don't think.\u201d Don't run them in the same block — and the moment an exercise starts sounding like an exercise in a solo, stop playing it that way.",
  ],
];

const sectionLabel = "text-[10px] uppercase tracking-widest text-neutral-600";
const gateBox = "mt-3 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-neutral-300";

export default function PlanView() {
  // null = unanswered; the entry level is the first "no".
  const [bench, setBench] = useState<(boolean | null)[]>(Array(CHECKS.length).fill(null));
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BENCH_KEY) ?? "[]");
      if (Array.isArray(saved) && saved.length === CHECKS.length) setBench(saved);
    } catch {
      // Corrupt answers — a blank bench test is fine.
    }
    const token = localStorage.getItem(TOKEN_KEY);
    setUnlocked(!!token);
    // Mark plan items that already exist in the space (matched by name), so
    // the buttons show what's been pulled in rather than double-spawning.
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    fetch(`/api/practice/exercises${q}`)
      .then((r) => r.json())
      .then((j) => {
        const names = new Set<string>(
          (j.exercises ?? [])
            .filter((e: { archived: boolean }) => !e.archived)
            .map((e: { name: string }) => e.name)
        );
        setAdded(names);
      })
      .catch(() => {});
  }, []);

  function answer(i: number, v: boolean) {
    setBench((b) => {
      const next = [...b];
      // Tapping the same answer again clears it.
      next[i] = next[i] === v ? null : v;
      localStorage.setItem(BENCH_KEY, JSON.stringify(next));
      return next;
    });
  }

  const firstNo = bench.findIndex((a) => a === false);
  const allAnswered = bench.every((a) => a !== null);
  const entry =
    firstNo >= 0 ? firstNo + 1 : allAnswered ? CHECKS.length : null;

  async function spawn(s: Spawn) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("Log in on the practice page first — your password is your identity here too.");
      return;
    }
    setBusy(s.name);
    setError(null);
    try {
      const res = await fetch(`/api/practice/exercises?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: s.name,
          // Timestamped video moments ride along in the description; the
          // first one is also the ref_url, so the card embeds the video
          // already cued to the right moment.
          description:
            s.desc +
            (s.refs.length
              ? "\n\n" + s.refs.map((r) => `${r.url.endsWith(".pdf") ? "▤" : "▶"} ${r.label} — ${r.url}`).join("\n")
              : ""),
          tools: s.tools,
          instrument: "guitar",
          ...(s.refs[0] ? { ref_url: s.refs[0].url } : {}),
          ...(s.target ? { target_bpm: s.target } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      setAdded((a) => new Set(a).add(s.name));
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
    }
  }

  // The moment in the source video where this exact thing is discussed.
  function RefChips({ refs }: { refs: Ref[] }) {
    return (
      <>
        {refs.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
          >
            {r.url.endsWith(".pdf") ? "▤" : "▶"} {r.label}
          </a>
        ))}
      </>
    );
  }

  // label: shown on the button when a level breaks into several separate
  // exercises, so each row says what it adds.
  function SpawnButton({ s, label }: { s: Spawn; label?: string }) {
    const done = added.has(s.name);
    return (
      <div className={`${label ? "" : "mt-3 "}flex flex-wrap items-center gap-1.5`}>
        <button
          onClick={() => !done && spawn(s)}
          disabled={done || busy === s.name}
          className={`rounded-md border px-2.5 py-1 text-xs ${
            done
              ? "cursor-default border-amber-500/40 bg-amber-500/10 text-amber-400"
              : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
          }`}
        >
          {done ? `✓ ${label ?? "in your list"}` : busy === s.name ? "adding…" : `+ ${label ?? "add to practice"}`}
        </button>
        <RefChips refs={s.refs} />
      </div>
    );
  }

  function LevelCard({ l }: { l: Level }) {
    return (
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-neutral-200 sm:text-base">
            <span className="mr-2 font-mono text-neutral-500">{l.num}</span>
            {l.title}
          </h3>
          <span className="shrink-0 text-xs text-neutral-600">{l.time}</span>
        </div>
        <p className="mt-2 text-sm text-neutral-400">{l.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
          {l.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {l.fujita && (
          <div className="mt-3 rounded-lg bg-neutral-950/50 p-3 text-sm text-neutral-400">
            <div className={sectionLabel}>{l.fujita.title}</div>
            <p className="mt-1">{l.fujita.body}</p>
          </div>
        )}
        {l.specs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {l.specs.map((s) => (
              <span key={s} className="rounded-full border border-neutral-800 px-2.5 py-0.5 text-xs text-neutral-500">
                {s}
              </span>
            ))}
          </div>
        )}
        <div className={gateBox}>
          <span className="mr-2 text-[10px] uppercase tracking-widest text-amber-500/70">gate</span>
          {l.gate}
        </div>
        {l.spawns.length === 1 ? (
          <SpawnButton s={l.spawns[0]} />
        ) : (
          <div className="mt-3 space-y-1.5">
            {l.spawns.map((s) => (
              <SpawnButton key={s.name} s={s} label={s.name.replace(/^L\d+ · /, "")} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-950 px-5 pb-24 text-neutral-100">
      <header className="flex items-baseline justify-between pb-4 pt-6">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">practice plan · guitar</h1>
        <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
          <a href="/practice" className="rounded-full border border-neutral-800 px-2.5 py-1 hover:border-neutral-600 hover:text-neutral-200">
            ← practice
          </a>
          <a href="/practice/tree" className="rounded-full border border-neutral-800 px-2.5 py-1 hover:border-neutral-600 hover:text-neutral-200">
            old tree
          </a>
        </nav>
      </header>

      <h2 className="text-xl font-semibold text-neutral-100">Bench Test to Bebop</h2>
      <p className="mt-2 text-sm text-neutral-400">
        Seven checks to find where you actually are, then the same seven levels in the order that makes each one
        usable — with Fujita&apos;s setup, rhythm and technique work running alongside. Nothing here is
        optional-but-nice; each level is what the next level is built out of.
      </p>
      <p className="mt-2 text-xs text-neutral-600">
        Ladder — Jens Larsen, &ldquo;Everything You Need To Learn For Jazz Guitar (In Order)&rdquo; · Diagnostics,
        tone, rhythm — Tomo Fujita on Playback Sessions, &ldquo;The Guitar Lesson Tomo Fujita Gives Every
        Student&rdquo;
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
          {!unlocked && (
            <>
              {" "}
              <a className="underline" href="/practice">
                go log in →
              </a>
            </>
          )}
        </div>
      )}

      {/* ---- bench test ---- */}
      <div className="mt-8">
        <div className={sectionLabel}>step one · about 20 minutes</div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">The bench test</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Record it before you start — Fujita has students hit record before any feedback, because you can&apos;t
          hear yourself while you&apos;re playing. &ldquo;Yes&rdquo; means clean, in time, and without hunting for
          the shape. Fujita&apos;s own threshold: if it takes more than about two and a half seconds to produce,
          you don&apos;t know it. The first &ldquo;no&rdquo; is where you start.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <RefChips refs={[fujita("1:21", 81), fujita("3:05", 185)]} />
        </div>
        <ol className="mt-4 space-y-3">
          {CHECKS.map((c, i) => (
            <li key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-neutral-200">{c.text}</p>
                  <p className="mt-1.5 text-xs text-neutral-500">{c.why}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {([true, false] as const).map((v) => (
                    <button
                      key={String(v)}
                      onClick={() => answer(i, v)}
                      aria-pressed={bench[i] === v}
                      className={`rounded-md border px-2.5 py-1 text-xs ${
                        bench[i] === v
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                          : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {v ? "yes" : "no"}
                    </button>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 rounded-xl border border-neutral-700 bg-neutral-900 p-4">
          <div className={sectionLabel}>entry point</div>
          <p className="mt-1 text-sm text-neutral-300">
            {entry === null
              ? "Answer the seven checks above. Your first \u201cno\u201d sets your entry level — everything above it becomes warm-up; everything below it waits until your level's gate is clear."
              : firstNo >= 0
                ? `Your entry level is ${entry} — level ${entry} is your current block, levels above it are warm-up, everything after waits for the gate.`
                : "All seven yes — you're at level 7's gate already. Work the phrasing level and the rails."}
          </p>
        </div>
      </div>

      {/* ---- L0 ---- */}
      <div className="mt-10">
        <div className={sectionLabel}>before level one</div>
        <div className="mt-2">
          <LevelCard l={L0} />
        </div>
      </div>

      {/* ---- ladder ---- */}
      <div className="mt-10">
        <div className={sectionLabel}>step two · the ladder</div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">Seven levels, in order</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Stepping stones across a stream — miss one and you&apos;re in the water. Each level names the exercise,
          the spec to run it at, and the gate that says you&apos;re allowed to move on.
        </p>
        <div className="mt-4 space-y-4">
          {LEVELS.map((l) => (
            <LevelCard key={l.num} l={l} />
          ))}
        </div>
      </div>

      {/* ---- rails ---- */}
      <div className="mt-10">
        <div className={sectionLabel}>runs alongside every level</div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">Two daily rails</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Neither of these is level-gated. Fujita treats both as the things that decide whether any of the material
          above turns into music.
        </p>
        <div className="mt-4 space-y-4">
          {RAILS.map((r) => (
            <section key={r.title} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <h3 className="text-sm font-semibold text-neutral-200 sm:text-base">{r.title}</h3>
              <p className="mt-2 text-sm text-neutral-400">{r.intro}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                {r.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <SpawnButton s={r.spawn} />
            </section>
          ))}
        </div>
      </div>

      {/* ---- a day ---- */}
      <div className="mt-10">
        <div className={sectionLabel}>step three · what a day looks like</div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">Twenty-five minutes</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Sized for the level you scored into. If you only have fifteen, cut the warm-up and shorten the play block
          — never the current level.
        </p>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-800">
          {DAY.map(([min, block, what], i) => (
            <div key={block} className={`flex gap-3 px-4 py-2.5 text-sm ${i > 0 ? "border-t border-neutral-800" : ""}`}>
              <span className="w-8 shrink-0 text-right font-mono text-neutral-500">{min}′</span>
              <span className="w-24 shrink-0 text-neutral-200">{block}</span>
              <span className="text-neutral-400">{what}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- rules ---- */}
      <div className="mt-10">
        <div className={sectionLabel}>the rules under all of it</div>
        <h2 className="mt-1 text-lg font-semibold text-neutral-100">How not to waste the year</h2>
        <div className="mt-4 space-y-3">
          {RULES.map(([head, body]) => (
            <div key={head} className="text-sm">
              <span className="font-medium text-neutral-200">{head}</span>{" "}
              <span className="text-neutral-400">{body}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 border-t border-neutral-900 pt-4 text-xs text-neutral-600">
        Assembled from the two transcripts. Level ordering, shell voicings, Satin Doll fingerings and the
        target-note method from the Jens Larsen video; bench test, amp and guitar setup, Blue Monk dynamics, rhythm
        and picking rails, and the chromatic-approach route from the Fujita interview.
      </p>
    </main>
  );
}
