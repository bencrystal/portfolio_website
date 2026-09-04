"use client";

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import BpmRuler from "./BpmRuler";
import Chart, { Series } from "./Chart";
import Reveal from "./Reveal";
import Tuner from "./Tuner";
import { ClickSound, Metronome } from "./metronome";

// Variant: which stroke the exercise starts on, for exercises practiced both
// ways at different tempos. Sessions logged before the flag existed count as
// down-strokes (the usual default).
type Variant = "down" | "up";

type Exercise = {
  id: string;
  name: string;
  position: number;
  archived: boolean;
  ref_url?: string | null;
  track_variants?: boolean;
  description?: string | null;
  target_bpm?: number | null;
  tools?: { metronome?: boolean; random_key?: boolean } | null;
};

// Which tools an exercise wants in the session hero. Metronome-only until
// flagged otherwise, so existing exercises keep their current behavior.
function toolsOf(e?: Exercise | null) {
  return { metronome: true, random_key: false, ...(e?.tools ?? {}) };
}
type Session = {
  id: string;
  exercise_id: string;
  date: string; // yyyy-mm-dd
  bpm: number | null;
  seconds: number | null;
  note: string | null;
  variant?: Variant | null;
  created_at: string;
};

const TOKEN_KEY = "practice_token";

// Same stable-color trick as /list: hash the id into a palette slot. The
// component then resolves collisions so no two exercises share a dot.
const PALETTE = ["#3b82f6", "#ef4444", "#eab308", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#ec4899"];
function hashSlot(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return h % PALETTE.length;
}

// 12 chromatic pitches; the black keys carry both spellings.
const NOTE_PAIRS: string[][] = [
  ["A"], ["A#", "Bb"], ["B"], ["C"], ["C#", "Db"], ["D"],
  ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"],
];

type Note = { idx: number; label: string };

// Random pitch, never the same as the previous one; black keys get their
// flat spelling half the time.
function randNote(excludeIdx: number | null): Note {
  let idx = excludeIdx;
  while (idx === excludeIdx) idx = Math.floor(Math.random() * 12);
  const pair = NOTE_PAIRS[idx!];
  return { idx: idx!, label: pair.length === 2 && Math.random() < 0.5 ? pair[1] : pair[0] };
}

const PREFS_KEY = "practice_prefs";
// First visit shows a short how-it-works card; dismissing it is remembered
// and the header's "?" brings it back.
const HINT_KEY = "practice_hint_dismissed";
// Three coach-marks (arm → Start → Log it) shown once per device to a user
// with no logged sessions; the hint card can replay them.
const COACH_KEY = "practice_coach_v1";

// Starter suggestions for an empty space come from the skill tree's first
// tier — one per branch, so the first tap already has direction.
const STARTER_BRANCHES: Record<string, string> = {
  picking: "Picking",
  fingerpicking: "Fingerpicking",
  rhythm: "Rhythm & time",
  theory: "Theory & ears",
  repertoire: "Repertoire",
};
type StarterNode = { id: string; branch: string; position: number; tier: number | null; name: string; description: string | null };

// Mutations that fail because the network is down get queued here and
// replayed in order once the connection returns (same pattern as /list).
const QUEUE_KEY = "practice_offline_queue";
type QueuedCall = { path: "exercises" | "sessions"; method: string; body: unknown };
function readQueue(): QueuedCall[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function fmtSecs(total: number) {
  const s = Math.round(total);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Durations shown next to dates read as clock times ("11:00" looks like
// 11 o'clock), so aggregates use unit words instead. The colon format stays
// for the live stopwatch and CSV, where it reads as elapsed time.
function fmtDur(total: number) {
  const s = Math.round(total);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

// "7:43" -> 463s, "1:02:30" -> 3750s, "5" -> 300s (bare number = minutes).
function parseDur(text: string): number | null {
  const t = text.trim();
  if (!t) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(t)) return null;
  const parts = t.split(":").map(Number);
  if (parts.length === 1) return parts[0] * 60;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtDateShort(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const clampBpm = (b: number) => Math.min(300, Math.max(20, Math.round(b)));

// Per-exercise daily rollup: total time, top BPM, newest first.
type DayAgg = { date: string; seconds: number; bpm: number };
function aggByDate(sessions: Session[], exId: string, variant?: Variant): DayAgg[] {
  const byDate = new Map<string, DayAgg>();
  for (const s of sessions) {
    if (s.exercise_id !== exId) continue;
    if (variant && (s.variant ?? "down") !== variant) continue;
    const cur = byDate.get(s.date) ?? { date: s.date, seconds: 0, bpm: 0 };
    cur.seconds += s.seconds ?? 0;
    cur.bpm = Math.max(cur.bpm, s.bpm ?? 0);
    byDate.set(s.date, cur);
  }
  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// "96 bpm · 4m 10s" — whichever parts an aggregate actually has.
function fmtAgg(a: DayAgg) {
  return [a.bpm > 0 ? `${a.bpm} bpm` : "", a.seconds > 0 ? fmtDur(a.seconds) : ""].filter(Boolean).join(" · ");
}

type FormState = {
  id?: string; // present when editing an existing entry
  exercise_id: string;
  date: string;
  bpm: string;
  dur: string;
  note: string;
  variant?: string; // "" | "down" | "up"
};

// Current + upcoming note. When morphMs is set (auto-advance, a few beats
// before the swap) the upcoming label eases into the current one's spot while
// the current shrinks away, landing right as the swap happens on the downbeat.
function NoteMorph({
  cur,
  next,
  morphMs,
  curClass,
  nextClass,
}: {
  cur: string;
  next: string | null;
  morphMs: number | null;
  curClass: string;
  nextClass: string;
}) {
  const [active, setActive] = useState(false);
  // Measured end pose: how far (and how much bigger) the upcoming note must
  // travel so it lands exactly on the current note's spot at the swap.
  const [target, setTarget] = useState<{ x: number; y: number; s: number } | null>(null);
  const curRef = useRef<HTMLSpanElement | null>(null);
  const nextRef = useRef<HTMLSpanElement | null>(null);
  // Reset synchronously when the note swaps so the new pair paints at rest
  // (no one-frame flash of the animated state).
  const [prevCur, setPrevCur] = useState(cur);
  if (prevCur !== cur) {
    setPrevCur(cur);
    setActive(false);
  }
  useEffect(() => {
    if (morphMs == null) {
      setActive(false);
      return;
    }
    // Double rAF: measure the at-rest layout first, then start the ease.
    let id2 = 0;
    const id = requestAnimationFrame(() => {
      const c = curRef.current?.getBoundingClientRect();
      const n = nextRef.current?.getBoundingClientRect();
      if (c && n && n.height > 0) {
        setTarget({
          x: c.left + c.width / 2 - (n.left + n.width / 2),
          y: c.top + c.height / 2 - (n.top + n.height / 2),
          s: c.height / n.height,
        });
      }
      id2 = requestAnimationFrame(() => setActive(true));
    });
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(id2);
    };
  }, [morphMs, cur]);
  const ease = `all ${morphMs ?? 0}ms cubic-bezier(0.65, 0, 0.35, 1)`; // easeInOutCubic
  return (
    <>
      <span
        ref={curRef}
        className={curClass}
        style={
          active
            ? { transition: ease, opacity: 0, transform: "scale(0.55)", transformOrigin: "center" }
            : { opacity: 1, transform: "none" }
        }
      >
        {cur}
      </span>
      {next && (
        <span
          ref={nextRef}
          className={nextClass}
          style={
            active && target
              ? {
                  transition: ease,
                  transform: `translate(${target.x}px, ${target.y}px) scale(${target.s})`,
                  transformOrigin: "center",
                  color: "#f5f5f5",
                }
              : { transform: "none" }
          }
        >
          {next}
        </span>
      )}
    </>
  );
}

// Descriptions are plain text with newlines preserved, but runs of lines that
// look like ASCII tab (3+ dashes) get a monospace block with horizontal
// scroll — reflowing tab in a proportional font destroys its alignment.
const TAB_LINE = /-{3,}/;
function DescriptionBody({ text }: { text: string }) {
  const blocks: { mono: boolean; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const mono = TAB_LINE.test(line);
    const last = blocks[blocks.length - 1];
    if (last && last.mono === mono) last.lines.push(line);
    else blocks.push({ mono, lines: [line] });
  }
  return (
    <div className="space-y-1.5">
      {blocks.map((b, i) =>
        b.mono ? (
          <pre
            key={i}
            className="overflow-x-auto whitespace-pre rounded bg-neutral-950 p-2 font-mono text-[11px] leading-4 text-neutral-300"
          >
            {b.lines.join("\n")}
          </pre>
        ) : (
          b.lines.join("\n").trim() && (
            <p key={i} className="whitespace-pre-line text-xs text-neutral-400">
              {b.lines.join("\n").trim()}
            </p>
          )
        )
      )}
    </div>
  );
}

// One spotlight of the coach tour: dims everything except the target element
// (giant box-shadow trick) and floats a small card beside it. The overlay is
// pointer-transparent so tapping the highlighted control itself advances the
// tour naturally.
function CoachMark({
  target,
  text,
  step,
  total,
  nextLabel,
  onNext,
  onSkip,
}: {
  target: RefObject<HTMLElement | null>;
  text: string;
  step: number;
  total: number;
  nextLabel: string;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number; bottom: number } | null>(
    null
  );
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [target, step]);
  if (!rect || rect.width === 0) return null;
  const below = rect.bottom + 150 < window.innerHeight;
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <div
        className="absolute rounded-xl ring-2 ring-amber-400/90 transition-all duration-300"
        style={{
          left: rect.left - 6,
          top: rect.top - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: "0 0 0 9999px rgba(10,10,10,0.72)",
        }}
      />
      <div
        className="pointer-events-auto absolute w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-200 shadow-2xl"
        style={{
          left: Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - 272)),
          top: below ? rect.bottom + 14 : Math.max(16, rect.top - 132),
        }}
      >
        <p>{text}</p>
        <div className="mt-2.5 flex items-center justify-between text-xs">
          <button className="text-neutral-500 hover:text-neutral-300" onClick={onSkip}>
            skip
          </button>
          <span className="tabular-nums text-neutral-600">
            {step + 1} / {total}
          </span>
          <button
            className="rounded-md bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-950 hover:bg-white"
            onClick={onNext}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PracticeView() {
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- edit unlock ---
  const [unlocked, setUnlocked] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  // --- metronome ---
  const metro = useRef<Metronome | null>(null);
  const [bpm, setBpm] = useState(100);
  const [running, setRunning] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [pulse, setPulse] = useState(-1);
  const [metroOpen, setMetroOpen] = useState(false); // mobile: full controls expanded
  const [sound, setSound] = useState<ClickSound>("beep");
  const [volume, setVolume] = useState(1);
  const taps = useRef<number[]>([]);

  // --- random note ---
  const [noteCur, setNoteCur] = useState<Note | null>(null);
  const [noteNext, setNoteNext] = useState<Note | null>(null);
  const noteRef = useRef<{ cur: Note | null; next: Note | null }>({ cur: null, next: null });
  // Auto-advance interval in beats while the metronome runs (0 = off).
  const [noteSync, setNoteSync] = useState(0);
  const noteSyncRef = useRef(0);
  const barCount = useRef(-1); // bars since start; -1 until the first downbeat
  const [noteMorph, setNoteMorph] = useState<number | null>(null); // ms of the lead-in animation
  // Downbeat drone of the current note; muted by default and not persisted.
  const [droneOn, setDroneOn] = useState(false);
  const droneRef = useRef(false);

  // --- stopwatch ---
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("down"); // stroke-start for tracked exercises
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // ms
  const swStart = useRef(0);
  const swAccum = useRef(0);

  // --- session extras ---
  const [countIn, setCountIn] = useState(false); // one bar of clicks before the timer
  const [countingIn, setCountingIn] = useState(false);
  const countInPending = useRef(false);
  const [trainer, setTrainer] = useState(false); // auto-bump bpm while running
  const [trainerAdd, setTrainerAdd] = useState(2);
  const [trainerBars, setTrainerBars] = useState(4);
  const trainerRef = useRef({ on: false, add: 2, bars: 4 });
  const [offline, setOffline] = useState(false);
  const flushing = useRef(false);
  // The 90% flow is exercise → Start → Log it; everything else (count-in,
  // trainer, sound, meter) hides behind "options" so the hero stays simple.
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  // --- log form / cards / charts ---
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<{ session: Session; pb: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [metric, setMetric] = useState<"seconds" | "bpm">("seconds");
  const [focusEx, setFocusEx] = useState<string | null>(null); // chart legend isolation
  const [manageOpen, setManageOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false); // log shows ~2 entries until expanded
  // Armed mode: everything but the hero retracts behind these headers.
  const [openPanels, setOpenPanels] = useState({ progress: false, log: false, tools: false });
  // Set when "done" is tapped on the last exercise in the queue — shows the
  // day summary card in browse mode.
  const [dayDone, setDayDone] = useState(false);
  // Hero stays compact for daily use: the big bpm ruler and the write-up both
  // live behind toggles. Details auto-open while an exercise is still new
  // (fewer than ~3 practiced days) and collapse once it's routine.
  const [tempoOpen, setTempoOpen] = useState(false);
  // One-shot "same / +2 / +5" prompt after arming: the dial already sits on
  // the last bpm, this row just asks whether today pushes it. Any answer
  // (or starting a session) retires it until the next arm.
  const [bpmPromptSeen, setBpmPromptSeen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState<boolean | null>(null); // null = auto by age
  useEffect(() => setDetailsOpen(null), [selectedEx]);
  const logRef = useRef<HTMLDivElement | null>(null); // measured so max-height can lerp open
  const [newExName, setNewExName] = useState("");
  const [newExTools, setNewExTools] = useState({ metronome: true, random_key: false });
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [hoverRef, setHoverRef] = useState<string | null>(null); // desktop hover preview
  const dragEx = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const attachTarget = useRef<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [descEdit, setDescEdit] = useState<{ id: string; text: string } | null>(null);
  // Empty-space starters + first-visit coach-marks.
  const [starters, setStarters] = useState<StarterNode[] | null>(null);
  const [starterBusy, setStarterBusy] = useState<string | null>(null);
  const [coach, setCoach] = useState<number | null>(null); // -1 welcome · 0 arm · 1 start · 2 log
  const coachListRef = useRef<HTMLElement | null>(null);
  const coachStartRef = useRef<HTMLDivElement | null>(null);
  // Desktop tool strip: the tuner unfolds under it.
  const [tunerOpen, setTunerOpen] = useState(false);
  // ?fresh — dev preview of the first-visit experience: empty space, starter
  // picks, coach-marks. Read-only; nothing touches the network or localStorage.
  const [fresh, setFresh] = useState(false);

  function getMetro() {
    metro.current ??= new Metronome();
    return metro.current;
  }

  // ---------- data ----------

  // Load the space belonging to the given password (or the default, public
  // space without one). A stale saved password falls back to the public view.
  async function fetchAll(token: string | null): Promise<void> {
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    const [exR, seR] = await Promise.all([
      fetch(`/api/practice/exercises${q}`),
      fetch(`/api/practice/sessions${q}`),
    ]);
    if (token && (exR.status === 401 || seR.status === 401)) {
      localStorage.removeItem(TOKEN_KEY);
      setUnlocked(false);
      return fetchAll(null);
    }
    const [ex, se] = await Promise.all([exR.json(), seR.json()]);
    if (ex.error || se.error) throw new Error(ex.error ?? se.error);
    setExercises(ex.exercises);
    setSessions(se.sessions);
    // No auto-arm: the page opens in browse mode (all tools out) and only
    // rearranges around an exercise once one is deliberately tapped.
    setSelectedEx((cur) => (cur && ex.exercises.some((e: Exercise) => e.id === cur) ? cur : null));
  }

  useEffect(() => {
    // ?fresh: pretend this device has never seen the page. Empty space,
    // pristine localStorage-derived UI, no data fetch, no writes anywhere.
    if (new URLSearchParams(location.search).has("fresh")) {
      setFresh(true);
      setExercises([]);
      setSessions([]);
      setHintOpen(true);
      return;
    }
    // Flush queued offline writes before reading, so the server catches up
    // before its state overwrites ours. Re-run whenever the network returns.
    const sync = () => {
      void flushQueue().then(() =>
        fetchAll(localStorage.getItem(TOKEN_KEY)).catch((e) => {
          if (e instanceof TypeError) setOffline(true); // network down; cached data stands
          else setError(String(e.message ?? e));
        })
      );
    };
    sync();
    window.addEventListener("online", sync);
    // The service worker caches the shell + last API reads so the installed
    // app opens (read-only fresh data aside) with no connection.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/practice-sw.js", { scope: "/practice" }).catch(() => {});
    }
    // Re-verify a remembered password silently.
    if (localStorage.getItem(TOKEN_KEY)) void verifyToken(localStorage.getItem(TOKEN_KEY)!).then(setUnlocked).catch(() => {});
    // Restore metronome prefs.
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      if (typeof p.bpm === "number") setBpm(clampBpm(p.bpm));
      if (typeof p.beatsPerBar === "number") setBeatsPerBar(p.beatsPerBar);
      if (["beep", "wood", "tick"].includes(p.sound)) setSound(p.sound);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
      if (typeof p.noteSync === "number") setNoteSync(p.noteSync);
      if (typeof p.countIn === "boolean") setCountIn(p.countIn);
      if (typeof p.trainer === "boolean") setTrainer(p.trainer);
      if ([1, 2, 5].includes(p.trainerAdd)) setTrainerAdd(p.trainerAdd);
      if ([2, 4, 8, 16].includes(p.trainerBars)) setTrainerBars(p.trainerBars);
      if (typeof p.extrasOpen === "boolean") setExtrasOpen(p.extrasOpen);
    } catch {
      // Corrupt prefs — defaults are fine.
    }
    if (!localStorage.getItem(HINT_KEY)) setHintOpen(true);
    return () => window.removeEventListener("online", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A brand-new space is a blank page — fetch the skill tree's opening moves
  // so the first decision is a tap, not a blinking cursor.
  const noExercises = exercises !== null && exercises.filter((e) => !e.archived).length === 0;
  useEffect(() => {
    if (!noExercises || starters !== null) return;
    const token = fresh ? null : localStorage.getItem(TOKEN_KEY);
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    fetch(`/api/practice/tree${q}`)
      .then((r) => r.json())
      .then((j) => {
        const nodes = (j.nodes ?? []) as StarterNode[];
        const picks: StarterNode[] = [];
        for (const b of Object.keys(STARTER_BRANCHES)) {
          const first = nodes
            .filter((n) => n.branch === b && (n.tier ?? 1) === 1)
            .sort((a, z) => a.position - z.position)[0];
          if (first) picks.push(first);
        }
        setStarters(picks);
      })
      .catch(() => setStarters([]));
  }, [noExercises, starters]);

  // One tap on a starter spawns the exercise exactly like the tree page does.
  async function startStarter(nodeId: string) {
    // Fresh preview: fake the spawn locally so the whole first-visit flow
    // (starter → coach-marks → arm) is walkable without writing anything.
    if (fresh) {
      const n = starters?.find((s) => s.id === nodeId);
      if (!n) return;
      setExercises((ex) => [
        ...(ex ?? []),
        {
          id: `fresh-${n.id}`,
          name: n.name,
          position: (ex?.length ?? 0) + 1,
          archived: false,
          description: n.description,
          tools: { metronome: true },
        },
      ]);
      return;
    }
    const token = localStorage.getItem(TOKEN_KEY) ?? "";
    setStarterBusy(nodeId);
    try {
      const res = await fetch(`/api/practice/tree?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: nodeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? res.statusText);
      setExercises((ex) => [...(ex ?? []), json.exercise as Exercise]);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setStarterBusy(null);
    }
  }

  useEffect(() => {
    // Checked via the URL (not state) so the very first run can't clobber
    // real prefs before the fresh flag lands.
    if (new URLSearchParams(location.search).has("fresh")) return;
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ bpm, beatsPerBar, sound, volume, noteSync, countIn, trainer, trainerAdd, trainerBars, extrasOpen })
    );
  }, [bpm, beatsPerBar, sound, volume, noteSync, countIn, trainer, trainerAdd, trainerBars, extrasOpen]);

  useEffect(() => {
    trainerRef.current = { on: trainer, add: trainerAdd, bars: trainerBars };
  }, [trainer, trainerAdd, trainerBars]);

  // The sessions PATCH route checks the token before reading the body, so an
  // empty body distinguishes "authorized but bad request" (400) from 401.
  async function verifyToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/practice/sessions?token=${encodeURIComponent(token)}`, {
        method: "PATCH",
        body: "{}",
      });
      return res.status !== 401;
    } catch {
      return true; // can't check offline — trust the saved password until we can
    }
  }

  // Offline mutations queue for replay and answer with a local stand-in so
  // callers (and the UI) proceed as if the write landed.
  function offlineEcho(path: "exercises" | "sessions", method: string, body: unknown) {
    const b = body as Record<string, unknown>;
    if (method === "DELETE") return { ok: true };
    if (path === "sessions") {
      if (method === "PATCH") {
        const prev = (sessions ?? []).find((s) => s.id === b.id);
        return { session: { ...prev, ...b } };
      }
      return {
        session: {
          id: `local-${Date.now()}`,
          created_at: new Date().toISOString(),
          bpm: null,
          seconds: null,
          note: null,
          variant: null,
          ...b,
        },
      };
    }
    if (method === "PATCH") {
      const prev = (exercises ?? []).find((e) => e.id === b.id);
      return { exercise: { ...prev, ...b } };
    }
    return { exercise: { id: `local-${Date.now()}`, position: Date.now() / 1000, archived: false, ...b } };
  }

  async function api(path: "exercises" | "sessions", method: string, body: unknown) {
    const token = localStorage.getItem(TOKEN_KEY) ?? "";
    let res: Response;
    try {
      res = await fetch(`/api/practice/${path}?token=${encodeURIComponent(token)}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      // Network down: queue the write and keep going locally.
      setOffline(true);
      localStorage.setItem(QUEUE_KEY, JSON.stringify([...readQueue(), { path, method, body }]));
      return offlineEcho(path, method, body);
    }
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setUnlocked(false);
      setUnlockOpen(true);
      throw new Error("Password needed");
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Request failed");
    return json;
  }

  // Replay queued offline writes in order. Dequeue on any server response,
  // even an error — replaying a bad request forever would wedge the queue.
  async function flushQueue() {
    if (flushing.current) return;
    flushing.current = true;
    try {
      const token = localStorage.getItem(TOKEN_KEY) ?? "";
      let q = readQueue();
      while (q.length) {
        const item = q[0];
        try {
          await fetch(`/api/practice/${item.path}?token=${encodeURIComponent(token)}`, {
            method: item.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.body),
          });
        } catch {
          return; // still offline; keep the rest queued
        }
        q = q.slice(1);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
      }
      setOffline(false);
    } finally {
      flushing.current = false;
    }
  }

  async function submitPassword() {
    const pw = pwInput.trim();
    if (!pw) return;
    if (await verifyToken(pw)) {
      localStorage.setItem(TOKEN_KEY, pw);
      setUnlocked(true);
      setUnlockOpen(false);
      setPwInput("");
      setPwError(false);
      // The password names a space: load its data and drop stale selections.
      setExercises(null);
      setSessions(null);
      setForm(null);
      setExpandedEx(null);
      setFocusEx(null);
      setJustLogged(null);
      void fetchAll(pw).catch((e) => setError(String(e.message ?? e)));
    } else {
      setPwError(true);
    }
  }

  // Back to the public (default) view; the saved password is forgotten.
  function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    setUnlocked(false);
    setExercises(null);
    setSessions(null);
    setForm(null);
    setExpandedEx(null);
    setFocusEx(null);
    setJustLogged(null);
    void fetchAll(null).catch((e) => setError(String(e.message ?? e)));
  }

  function requireUnlock(): boolean {
    if (unlocked) return true;
    setUnlockOpen(true);
    return false;
  }

  // ---------- metronome ----------

  // A2-rooted so the drone sits under the clicks.
  const droneHz = (idx: number) => 110 * Math.pow(2, idx / 12);

  // Advance to the (pre-generated) next note and queue a fresh one, so the
  // upcoming note can always be previewed.
  const advanceNote = useCallback(() => {
    const cur = noteRef.current.next ?? randNote(noteRef.current.cur?.idx ?? null);
    const next = randNote(cur.idx);
    noteRef.current = { cur, next };
    setNoteCur(cur);
    setNoteNext(next);
    setNoteMorph(null);
    // The drone must always sound the note on screen, so every change —
    // auto-sync mid-bar or a manual tap — retriggers it at the new pitch.
    if (droneRef.current && metro.current?.running) metro.current.playDrone(droneHz(cur.idx));
  }, []);

  const toggleMetronome = useCallback(() => {
    const m = getMetro();
    m.onBeat = (b) => {
      setPulse(b);
      if (b === 0) {
        barCount.current++;
        // Count-in: the stopwatch engages on the downbeat after one full bar.
        if (countInPending.current && barCount.current >= 1) {
          countInPending.current = false;
          setCountingIn(false);
          swStart.current = performance.now();
          setSwRunning(true);
        }
        // Tempo trainer: nudge the dial up every N completed bars.
        const tr = trainerRef.current;
        if (tr.on && barCount.current > 0 && barCount.current % tr.bars === 0) {
          setBpm((v) => clampBpm(v + tr.add));
        }
      }
      const every = noteSyncRef.current;
      let swapped = false;
      if (every > 0 && barCount.current >= 0) {
        // Count beats from the bar structure (not a free-running counter) so
        // note changes stay anchored to the downbeat even if the interval is
        // switched on mid-run.
        const beatIndex = barCount.current * m.beatsPerBar + b;
        if (beatIndex % every === 0) {
          advanceNote(); // retriggers the drone itself at the new pitch
          swapped = true;
        }
        // Up to 4 beats before the swap, start easing the upcoming note in.
        const lead = Math.min(4, every);
        if ((beatIndex + lead) % every === 0) setNoteMorph((lead * 60000) / m.bpm);
      }
      // Downbeats re-sound the held note so the drone never dies out mid-bar.
      if (b === 0 && !swapped && droneRef.current) {
        const cur = noteRef.current.cur;
        if (cur) m.playDrone(droneHz(cur.idx));
      }
    };
    if (m.running) {
      m.stop();
      setRunning(false);
      setPulse(-1);
      setNoteMorph(null);
      // Killing the clicks mid-count-in cancels the pending timer start.
      countInPending.current = false;
      setCountingIn(false);
    } else {
      m.bpm = bpm;
      m.beatsPerBar = beatsPerBar;
      barCount.current = -1;
      m.start();
      setRunning(true);
    }
  }, [bpm, beatsPerBar, advanceNote]);

  useEffect(() => {
    getMetro().bpm = bpm;
  }, [bpm]);
  useEffect(() => {
    getMetro().beatsPerBar = beatsPerBar;
  }, [beatsPerBar]);
  useEffect(() => {
    getMetro().sound = sound;
  }, [sound]);
  useEffect(() => {
    getMetro().volume = volume;
  }, [volume]);
  useEffect(() => {
    noteSyncRef.current = noteSync;
  }, [noteSync]);
  useEffect(() => {
    droneRef.current = droneOn;
    if (!droneOn) metro.current?.stopDrone();
    // Unmuting mid-run sounds the current note right away rather than
    // leaving silence until the next downbeat.
    else if (metro.current?.running && noteRef.current.cur)
      metro.current.playDrone(droneHz(noteRef.current.cur.idx));
  }, [droneOn]);

  const nudgeBpm = (d: number) => setBpm((b) => clampBpm(b + d));

  function tapTempo() {
    const now = performance.now();
    // A pause over 2s starts a fresh measurement.
    if (taps.current.length && now - taps.current[taps.current.length - 1] > 2000) taps.current = [];
    taps.current.push(now);
    taps.current = taps.current.slice(-6);
    if (taps.current.length >= 2) {
      const t = taps.current;
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1);
      setBpm(clampBpm(60000 / avg));
    }
  }

  // ---------- keyboard ----------

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey) return;
      if (e.key === "n" || e.key === "N") advanceNote();
      else if (e.key === " ") toggleMetronome();
      else if (e.key === "ArrowUp") nudgeBpm(+1);
      else if (e.key === "ArrowDown") nudgeBpm(-1);
      else if (e.key === "ArrowRight") nudgeBpm(+5);
      else if (e.key === "ArrowLeft") nudgeBpm(-5);
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advanceNote, toggleMetronome]);

  // ---------- stopwatch ----------

  useEffect(() => {
    if (!swRunning) return;
    const t = setInterval(() => setSwElapsed(swAccum.current + performance.now() - swStart.current), 200);
    return () => clearInterval(t);
  }, [swRunning]);

  function swToggle() {
    if (swRunning) {
      swAccum.current += performance.now() - swStart.current;
      setSwElapsed(swAccum.current);
      setSwRunning(false);
    } else {
      swStart.current = performance.now();
      setSwRunning(true);
    }
  }

  function swReset() {
    swAccum.current = 0;
    setSwElapsed(0);
    setSwRunning(false);
  }

  // The one primary control: stopwatch and metronome move together. The
  // metronome alone stays reachable via its own small affordance.
  function startSession() {
    const m = getMetro();
    // Exercises can opt out of the metronome; Start then only runs the timer.
    const wantMetro = !selectedEx || toolsOf((exercises ?? []).find((x) => x.id === selectedEx)).metronome;
    if (swRunning || countingIn) {
      // Stop everything (a stop during the count-in just cancels it).
      countInPending.current = false;
      setCountingIn(false);
      if (swRunning) swToggle();
      if (m.running) toggleMetronome();
    } else if (countIn && wantMetro && !m.running) {
      // One bar of clicks first; the beat handler starts the timer.
      countInPending.current = true;
      setCountingIn(true);
      toggleMetronome();
    } else {
      swToggle();
      if (wantMetro && !m.running) toggleMetronome();
    }
  }

  // Toast a fresh log entry, celebrating if it set a new top BPM.
  function announceLog(session: Session, prevBest: number) {
    setJustLogged({ session, pb: session.bpm != null && prevBest > 0 && session.bpm > prevBest });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setJustLogged(null), 6000);
  }

  // Top BPM so far; per-variant when v is given so up-stroke bests count too.
  function bestBpm(exId: string, v?: Variant) {
    return Math.max(
      0,
      ...(sessions ?? [])
        .filter((s) => s.exercise_id === exId && (!v || (s.variant ?? "down") === v))
        .map((s) => s.bpm ?? 0)
    );
  }

  // One tap: save immediately with the current bpm/elapsed; undo toast after.
  async function swLog() {
    if (!requireUnlock()) return;
    if (!selectedEx) {
      setError("Pick an exercise first");
      return;
    }
    const totalMs = swRunning ? swAccum.current + performance.now() - swStart.current : swAccum.current;
    const seconds = Math.round(totalMs / 1000);
    const exId = selectedEx;
    const tracked = exById.get(exId)?.track_variants ?? false;
    const prevBest = bestBpm(exId, tracked ? variant : undefined);
    swReset();
    try {
      const { session } = await api("sessions", "POST", {
        exercise_id: exId,
        date: todayISO(),
        bpm,
        seconds,
        note: null,
        variant: tracked ? variant : null,
      });
      setSessions((s) => [...(s ?? []), session]);
      announceLog(session, prevBest);
    } catch (e) {
      // Fall back to the form so the measurement isn't lost.
      setForm({ exercise_id: exId, date: todayISO(), bpm: String(bpm), dur: fmtSecs(seconds), note: "" });
      setError(String((e as Error).message));
    }
  }

  async function undoLog() {
    if (!justLogged) return;
    const id = justLogged.session.id;
    setJustLogged(null);
    setSessions((s) => s!.filter((x) => x.id !== id));
    try {
      await api("sessions", "DELETE", { id });
    } catch (e) {
      setError(String((e as Error).message));
    }
  }

  // ---------- wake lock ----------

  // Keep the screen on while the metronome or stopwatch is going.
  const wantWake = running || swRunning;
  useEffect(() => {
    if (!wantWake) return;
    let lock: { release?: () => Promise<void> } | null = null;
    async function acquire() {
      try {
        lock = await (navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<never> } })
          .wakeLock?.request("screen") ?? null;
      } catch {
        // Denied (low battery etc.) — not worth surfacing.
      }
    }
    void acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release?.();
    };
  }, [wantWake]);

  // ---------- log entries ----------

  async function saveForm() {
    if (!form || !requireUnlock()) return;
    const seconds = parseDur(form.dur);
    const bpmNum = form.bpm.trim() ? Number(form.bpm) : null;
    if (!form.exercise_id) return setError("Pick an exercise");
    if (form.dur.trim() && seconds === null) return setError("Time should look like 5:12");
    if (form.bpm.trim() && !Number.isFinite(bpmNum)) return setError("BPM should be a number");
    setError(null);
    setSaving(true);
    try {
      const tracked = exById.get(form.exercise_id)?.track_variants ?? false;
      const body = {
        exercise_id: form.exercise_id,
        date: form.date,
        bpm: bpmNum,
        seconds,
        note: form.note,
        variant: tracked ? form.variant || null : null,
      };
      if (form.id) {
        const { session } = await api("sessions", "PATCH", { id: form.id, ...body });
        setSessions((s) => s!.map((x) => (x.id === session.id ? session : x)));
      } else {
        const prevBest = bestBpm(
          form.exercise_id,
          tracked ? ((form.variant as Variant) || "down") : undefined
        );
        const { session } = await api("sessions", "POST", body);
        setSessions((s) => [...(s ?? []), session]);
        announceLog(session, prevBest);
      }
      setForm(null);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    if (!requireUnlock()) return;
    if (!confirm("Delete this entry?")) return;
    const prev = sessions;
    setSessions((s) => s!.filter((x) => x.id !== id));
    try {
      await api("sessions", "DELETE", { id });
    } catch (e) {
      setSessions(prev);
      setError(String((e as Error).message));
    }
  }

  // ---------- exercises ----------

  async function addExercise() {
    const name = newExName.trim();
    if (!name || !requireUnlock()) return;
    try {
      const { exercise } = await api("exercises", "POST", { name, tools: newExTools });
      setExercises((ex) => [...(ex ?? []), exercise]);
      setNewExName("");
      setSelectedEx((cur) => cur ?? exercise.id);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }

  async function patchExercise(id: string, fields: Partial<Exercise>) {
    if (!requireUnlock()) return;
    try {
      const { exercise } = await api("exercises", "PATCH", { id, ...fields });
      setExercises((ex) => ex!.map((x) => (x.id === id ? exercise : x)));
    } catch (e) {
      setError(String((e as Error).message));
    }
  }

  // ---------- attachments ----------

  function isPdf(url: string) {
    return url.split("?")[0].toLowerCase().endsWith(".pdf");
  }

  // Uploads live in our Supabase bucket; anything else is an external link.
  function isUpload(url: string) {
    return url.includes("/storage/v1/object/public/");
  }

  function openRef(url: string) {
    // External links and PDFs get their own tab; uploaded images the lightbox.
    if (!isUpload(url) || isPdf(url)) window.open(url, "_blank", "noopener");
    else setLightbox(url);
  }

  function pickFile(exId: string) {
    if (!requireUnlock()) return;
    attachTarget.current = exId;
    fileInput.current?.click();
  }

  async function uploadRef(file: File) {
    const exId = attachTarget.current;
    if (!exId) return;
    setUploading(exId);
    try {
      const token = localStorage.getItem(TOKEN_KEY) ?? "";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("exercise_id", exId);
      const res = await fetch(`/api/practice/upload?token=${encodeURIComponent(token)}`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setExercises((ex) => ex!.map((x) => (x.id === exId ? json.exercise : x)));
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setUploading(null);
    }
  }

  function linkRef(ex: Exercise) {
    if (!requireUnlock()) return;
    const url = prompt("Link an image or PDF (https://…)", ex.ref_url ?? "");
    if (url === null) return;
    void patchExercise(ex.id, { ref_url: url.trim() || null } as Partial<Exercise>);
  }

  // ---------- reorder ----------

  // Give the moved exercise a position between its new neighbours.
  function positionBetween(list: Exercise[], to: number) {
    const prev = list[to - 1]?.position ?? (list[to + 1]?.position ?? 0) - 2;
    const next = list[to + 1]?.position ?? (list[to - 1]?.position ?? 0) + 2;
    return (prev + next) / 2;
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const list = active.slice();
    const from = list.findIndex((e) => e.id === fromId);
    const to = list.findIndex((e) => e.id === toId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    void patchExercise(moved.id, { position: positionBetween(list, to) });
  }

  function moveBy(ex: Exercise, dir: -1 | 1) {
    const list = active.slice();
    const from = list.findIndex((e) => e.id === ex.id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= list.length) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    void patchExercise(moved.id, { position: positionBetween(list, to) });
  }

  // ---------- csv export ----------

  function exportCsv() {
    const rows = [
      ["date", "exercise", "start", "bpm", "seconds", "time", "note"],
      ...byDateDesc.map((s) => [
        s.date,
        exById.get(s.exercise_id)?.name ?? "",
        s.variant ?? "",
        s.bpm ?? "",
        s.seconds ?? "",
        s.seconds != null ? fmtSecs(s.seconds) : "",
        s.note ?? "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `practice-log-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Tap a card: select it for the stopwatch and jump the metronome to the
  // BPM you last used on it, so you can start (or +5) without hunting.
  function armExercise(ex: Exercise, aggs: DayAgg[]) {
    setSelectedEx(ex.id);
    setDayDone(false);
    setBpmPromptSeen(false);
    if (ex.track_variants) {
      // Suggest whichever stroke-start you haven't done yet today.
      const todays = (sessions ?? []).filter((s) => s.exercise_id === ex.id && s.date === today);
      const done = (v: Variant) => todays.some((s) => (s.variant ?? "down") === v);
      const v: Variant = done("down") && !done("up") ? "up" : done("up") && !done("down") ? "down" : variant;
      setVariant(v);
      const refBpm = aggByDate(sessions ?? [], ex.id, v).find((a) => a.bpm > 0)?.bpm;
      if (refBpm) setBpm(clampBpm(refBpm));
    } else {
      const refBpm = aggs.find((a) => a.bpm > 0)?.bpm;
      if (refBpm) setBpm(clampBpm(refBpm));
    }
  }

  // Switching stroke-start also jumps the dial to that variant's last BPM.
  function selectVariant(v: Variant) {
    setVariant(v);
    if (selectedEx && exById.get(selectedEx)?.track_variants) {
      const refBpm = aggByDate(sessions ?? [], selectedEx, v).find((a) => a.bpm > 0)?.bpm;
      if (refBpm) setBpm(clampBpm(refBpm));
    }
  }

  // ---------- derived ----------

  const exById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const active = (exercises ?? []).filter((e) => !e.archived).sort((a, b) => a.position - b.position);
  const today = todayISO();
  // The hero shows only the armed exercise's tools; with nothing armed it's
  // the freeform fallback. New players get just the metronome — random key
  // and the settings line surface after a few practiced days, one module at
  // a time instead of the whole cockpit at once.
  const practicedDayCount = new Set((sessions ?? []).map((s) => s.date)).size;
  const seasoned = practicedDayCount >= 3;
  const heroTools = selectedEx
    ? toolsOf(exById.get(selectedEx))
    : { metronome: true, random_key: seasoned };
  // Arming an exercise rearranges the whole page around it: the hero goes
  // full-width and headlined, everything else retracts to compact.
  const armed = selectedEx ? exById.get(selectedEx) ?? null : null;
  const armedAggs = armed ? aggByDate(sessions ?? [], armed.id) : [];
  const armedToday = armedAggs[0]?.date === today ? armedAggs[0] : null;
  const armedLast = armedToday ? armedAggs[1] : armedAggs[0];
  const armedDelta =
    armedAggs[0] && armedAggs[1] && armedAggs[0].bpm > 0 && armedAggs[1].bpm > 0
      ? armedAggs[0].bpm - armedAggs[1].bpm
      : null;
  // Position in today's queue ("2 of 5"): the pills below the hero are the
  // rest of the queue, in the order you dragged them into.
  const queueIdx = armed ? active.findIndex((e) => e.id === armed.id) : -1;
  const queueLast = queueIdx === active.length - 1;
  // "Done for today" is earned, not positional: every exercise needs a log
  // today before the last one offers to wrap up.
  const loggedTodayIds = new Set((sessions ?? []).filter((s) => s.date === today).map((s) => s.exercise_id));
  const allLoggedToday = active.length > 0 && active.every((e) => loggedTodayIds.has(e.id));
  // Browse-mode CTA: the first exercise in queue order without a log today —
  // one tap drops you into the routine where you left off.
  const nextUp = active.find((e) => !loggedTodayIds.has(e.id)) ?? null;

  // ---------- coach-marks ----------
  // Three spotlights for a first-timer: arm → Start → Log it. Dim-only (the
  // page stays tappable) so doing the thing advances the tour by itself.
  function endCoach() {
    setCoach(null);
    if (!fresh) localStorage.setItem(COACH_KEY, "1");
  }
  useEffect(() => {
    if (exercises === null || sessions === null || coach !== null) return;
    if (!fresh && localStorage.getItem(COACH_KEY)) return;
    if (sessions.length > 0) {
      localStorage.setItem(COACH_KEY, "1"); // already knows the loop
      return;
    }
    if (exercises.some((e) => !e.archived) && !selectedEx) {
      setCoach(-1); // welcome card first, then the three spotlights
      setHintOpen(false); // one guide at a time
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, sessions, coach, selectedEx]);
  useEffect(() => {
    if (coach === 0 && selectedEx) setCoach(1);
  }, [coach, selectedEx]);
  useEffect(() => {
    if (coach === 1 && swRunning) setCoach(2);
  }, [coach, swRunning]);
  useEffect(() => {
    if (coach === 2 && justLogged) endCoach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach, justLogged]);

  // Identity colors: hash gives each exercise a stable starting slot, then we
  // walk to the next free one so no two dots collide (until the palette runs
  // out at 8). Sorted by id so the assignment doesn't shift on reorder.
  const colorByEx = new Map<string, string>();
  {
    const taken = new Set<number>();
    for (const id of (exercises ?? []).map((e) => e.id).sort()) {
      if (taken.size === PALETTE.length) taken.clear();
      let slot = hashSlot(id);
      while (taken.has(slot)) slot = (slot + 1) % PALETTE.length;
      taken.add(slot);
      colorByEx.set(id, PALETTE[slot]);
    }
  }
  const colorOf = (id: string) => colorByEx.get(id) ?? PALETTE[hashSlot(id)];

  // Streak: consecutive practiced days ending today (or yesterday, so it
  // doesn't read as broken before you've played today). Week: last 7 days.
  const practicedDates = new Set((sessions ?? []).map((s) => s.date));
  let streak = 0;
  {
    const d = new Date();
    const iso = () =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!practicedDates.has(iso())) d.setDate(d.getDate() - 1);
    while (practicedDates.has(iso())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
  }
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoISO = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth() + 1).padStart(2, "0")}-${String(
    weekAgo.getDate()
  ).padStart(2, "0")}`;
  const weekSecs = (sessions ?? [])
    .filter((s) => s.date >= weekAgoISO)
    .reduce((sum, s) => sum + (s.seconds ?? 0), 0);

  const totalSecs = (sessions ?? []).reduce((sum, s) => sum + (s.seconds ?? 0), 0);
  const daysPracticed = practicedDates.size;
  // Longest run of consecutive practiced days ever.
  let bestStreak = 0;
  {
    const ds = Array.from(practicedDates).sort();
    let run = 0;
    for (let i = 0; i < ds.length; i++) {
      const prev = new Date(ds[i] + "T00:00:00");
      prev.setDate(prev.getDate() - 1);
      const prevISO = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(
        prev.getDate()
      ).padStart(2, "0")}`;
      run = i > 0 && ds[i - 1] === prevISO ? run + 1 : 1;
      bestStreak = Math.max(bestStreak, run);
    }
  }

  // Variant-tracked exercises get two lines in the same color: solid for
  // down-stroke starts, dashed for up (the legend spells this out per entry).
  const series: Series[] = active
    .flatMap((ex) => {
      const mk = (v: Variant | undefined, suffix: string, dash: boolean): Series => ({
        name: ex.name + suffix,
        color: colorOf(ex.id),
        dash,
        // The goal line belongs to the exercise, so only its first series
        // carries it — otherwise it would draw (and label) twice.
        target: !dash && metric === "bpm" ? ex.target_bpm ?? undefined : undefined,
        points: aggByDate(sessions ?? [], ex.id, v)
          .map((a) => ({
            x: new Date(a.date + "T00:00:00").getTime(),
            y: a[metric],
            label: [fmtDateShort(a.date), a.bpm > 0 ? `${a.bpm} bpm` : "", a.seconds > 0 ? fmtDur(a.seconds) : ""]
              .filter(Boolean)
              .join(" · "),
          }))
          .filter((p) => p.y > 0)
          .reverse(),
      });
      return ex.track_variants
        ? [mk("down", " ↓ down", false), mk("up", " ↑ up", true)]
        : [mk(undefined, "", false)];
    })
    .filter((s) => s.points.length > 0);

  // Legend isolation: dim every line except the focused one.
  const displaySeries: Series[] = focusEx
    ? series.map((s) => (s.name === focusEx ? s : { ...s, color: s.color + "26" }))
    : series;

  const byDateDesc = [...(sessions ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );
  const dates = Array.from(new Set(byDateDesc.map((s) => s.date)));
  // With a single exercise the log would repeat its name every row.
  const manyEx = new Set(byDateDesc.map((s) => s.exercise_id)).size > 1;

  // Sessions that beat the exercise's (per-variant) top BPM at the time they
  // were logged. The first-ever entry doesn't count — nothing was beaten.
  const pbIds = new Set<string>();
  {
    const best = new Map<string, number>();
    const chrono = [...(sessions ?? [])].sort(
      (a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at)
    );
    for (const s of chrono) {
      if (s.bpm == null) continue;
      const key = `${s.exercise_id}|${s.variant ?? "down"}`;
      const prev = best.get(key) ?? 0;
      if (prev > 0 && s.bpm > prev) pbIds.add(s.id);
      best.set(key, Math.max(prev, s.bpm));
    }
  }

  const todayTotal = (sessions ?? [])
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.seconds ?? 0), 0);
  const todayExCount = new Set((sessions ?? []).filter((s) => s.date === today).map((s) => s.exercise_id)).size;

  // Today's time on the armed exercise, shown in the session hero.
  const selTodaySecs = (sessions ?? [])
    .filter((s) => s.exercise_id === selectedEx && s.date === today)
    .reduce((sum, s) => sum + (s.seconds ?? 0), 0);

  // With under 5 practiced days a line chart is mostly single dots, so the
  // Progress card shows a week strip + streak until there's a real trend.
  const chartReady = dates.length >= 5;
  const last7: { iso: string; label: string; done: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    last7.push({ iso, label: "SMTWTFS"[d.getDay()], done: practicedDates.has(iso) });
  }

  // Heatmap: daily totals (GitHub-style), shown once charts unlock. Sized to
  // the data — from the first logged day (min 8, max 26 weeks) — so a young
  // log isn't a field of empty cells. Amber intensity is relative to the
  // best day.
  const secsByDate = new Map<string, number>();
  for (const s of sessions ?? []) secsByDate.set(s.date, (secsByDate.get(s.date) ?? 0) + (s.seconds ?? 0));
  const heatMax = Math.max(1, ...Array.from(secsByDate.values()));
  const firstDate = dates[dates.length - 1]; // oldest practiced day (dates is desc)
  const heatWeekCount = Math.min(
    26,
    Math.max(
      8,
      Math.ceil((Date.now() - new Date((firstDate ?? today) + "T00:00:00").getTime()) / (7 * 86_400_000)) + 1
    )
  );
  const heatWeeks: { iso: string; secs: number; future: boolean }[][] = [];
  {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() - (heatWeekCount - 1) * 7); // back to a Sunday
    for (let w = 0; w < heatWeekCount; w++) {
      const col: (typeof heatWeeks)[number] = [];
      for (let d = 0; d < 7; d++) {
        const dt = new Date(start);
        dt.setDate(start.getDate() + w * 7 + d);
        const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        col.push({ iso, secs: secsByDate.get(iso) ?? 0, future: iso > today });
      }
      heatWeeks.push(col);
    }
  }

  const loading = exercises === null || sessions === null;

  // ---------- render ----------

  const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-4";
  const btn = "rounded-md bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 active:bg-neutral-600";
  const input =
    "rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm placeholder:text-neutral-600";

  const sessionBtn = (extra = "") => (
    <button
      className={`rounded-md px-4 py-2 text-sm font-semibold ${
        swRunning || countingIn
          ? "bg-amber-500 text-neutral-950 hover:bg-amber-400"
          : "bg-neutral-100 text-neutral-950 hover:bg-white"
      } ${extra}`}
      onClick={startSession}
    >
      {countingIn ? "…" : swRunning ? "Stop" : swElapsed > 0 ? "Resume" : "Start session"}
    </button>
  );

  // Tools: the tuner plus handy external references. Visible on mobile too —
  // tuning is the tool you want on a phone. Rendered in the tools column in
  // browse mode and behind a collapsed header in armed mode.
  const toolsSection = (
    <section className={`${card} mb-4`}>
      <h2 className="mb-2 text-sm font-medium text-neutral-400">Tools</h2>
      <Tuner />
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-neutral-800 pt-2 text-xs">
        {/* Pill chips like every other tappable thing on the page. */}
        <a
          className="rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-1 text-neutral-300 hover:border-neutral-400 hover:bg-neutral-700"
          href="https://www.oolimo.com/en/guitar-chords/analyze"
          target="_blank"
          rel="noopener noreferrer"
        >
          chord analyzer ↗
        </a>
        <a
          className="rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-1 text-neutral-300 hover:border-neutral-400 hover:bg-neutral-700"
          href="https://www.all-guitar-chords.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          chords &amp; scales ↗
        </a>
      </div>
    </section>
  );

  const entryForm = form && (
    <section className={`${card} mb-4 border-neutral-600`}>
      <h2 className="mb-3 text-sm font-medium text-neutral-300">{form.id ? "Edit entry" : "New entry"}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select
          value={form.exercise_id}
          onChange={(e) => setForm({ ...form, exercise_id: e.target.value })}
          className={`${input} col-span-2 sm:col-span-1`}
        >
          <option value="">Exercise…</option>
          {(exercises ?? []).map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} />
        <input
          inputMode="numeric"
          value={form.bpm}
          onChange={(e) => setForm({ ...form, bpm: e.target.value })}
          placeholder="BPM"
          className={input}
        />
        <input
          inputMode="numeric"
          value={form.dur}
          onChange={(e) => setForm({ ...form, dur: e.target.value })}
          placeholder="Time (5:12)"
          className={input}
        />
        {exById.get(form.exercise_id)?.track_variants && (
          <select
            value={form.variant ?? ""}
            onChange={(e) => setForm({ ...form, variant: e.target.value })}
            className={input}
          >
            <option value="">start…</option>
            <option value="down">↓ down</option>
            <option value="up">↑ up</option>
          </select>
        )}
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Note (optional)"
          className={`${input} col-span-2 sm:col-span-4`}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white disabled:opacity-50"
          disabled={saving}
          onClick={saveForm}
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button className={btn} onClick={() => setForm(null)}>
          Cancel
        </button>
      </div>
    </section>
  );

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-neutral-950 px-4 pb-24 text-neutral-100 lg:max-w-7xl lg:px-8">
      {/* Mobile: sticky control strip — bpm (tap to expand), nudge, start, note. */}
      <div
        className={`sticky top-0 z-20 -mx-4 items-center gap-2 border-b border-neutral-800 bg-neutral-950/95 px-4 py-2 backdrop-blur lg:hidden ${
          armed ? "hidden" : "flex"
        }`}
      >
        <button onClick={() => setMetroOpen((o) => !o)} className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tabular-nums">{bpm}</span>
          <span className="text-[10px] text-neutral-500">bpm {metroOpen ? "▾" : "▸"}</span>
        </button>
        <button className={btn} onClick={() => nudgeBpm(-5)}>
          −5
        </button>
        <button className={btn} onClick={() => nudgeBpm(+5)}>
          +5
        </button>
        {sessionBtn()}
        <button
          onClick={advanceNote}
          className="ml-auto flex min-w-[3.25rem] items-baseline justify-center gap-1.5 rounded-md bg-neutral-800 px-2 py-1.5 text-center text-xl font-bold hover:bg-neutral-700"
          aria-label="random note"
        >
          {noteCur ? (
            <NoteMorph
              cur={noteCur.label}
              next={noteSync > 0 ? noteNext?.label ?? null : null}
              morphMs={noteMorph}
              curClass="inline-block"
              nextClass="inline-block text-xs font-normal text-neutral-500"
            />
          ) : (
            "♪?"
          )}
        </button>
      </div>

      {/* While the timer runs, the page header steps out of the way. */}
      <div className={`flex items-center justify-between py-4 transition-opacity duration-500 ${swRunning ? "opacity-25" : ""}`}>
        <h1 className="text-xl font-semibold">Guitar Practice</h1>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-neutral-700 px-2 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            title="How it works"
            onClick={() => setHintOpen((o) => !o)}
          >
            ?
          </button>
          {unlocked ? (
            <span className="text-xs text-neutral-500">
              logged in ·{" "}
              <button className="underline hover:text-neutral-300" onClick={signOut}>
                log out
              </button>
            </span>
          ) : (
            <button
              className="rounded-md border border-neutral-600 px-3 py-1 text-xs font-semibold text-neutral-200 hover:border-neutral-400 hover:bg-neutral-800"
              onClick={() => setUnlockOpen(true)}
            >
              Log in
            </button>
          )}
        </div>
      </div>

      {/* Desktop tool strip: the always-available tools live up here — one
          click away in browse AND armed mode, never buried in a card. The
          armed exercise's flagged tools light up; the rest stay quiet.
          (Mobile keeps its own sticky strip + tools section.) */}
      <div className="mb-4 hidden items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 lg:flex">
        <div
          className={`flex items-center gap-2 rounded-md border px-2 py-1 ${
            heroTools.random_key ? "border-amber-500/50" : "border-neutral-800"
          }`}
        >
          <span className="text-[10px] uppercase tracking-widest text-neutral-600">random key</span>
          <button
            onClick={advanceNote}
            title="press N or tap for a new key"
            aria-label="new random key"
            className="min-w-[3rem] rounded-md bg-neutral-800 px-2.5 py-0.5 text-center hover:bg-neutral-700"
          >
            {noteCur ? (
              <NoteMorph
                cur={noteCur.label}
                next={noteSync > 0 ? noteNext?.label ?? null : null}
                morphMs={noteMorph}
                curClass="inline-block font-bold"
                nextClass="ml-1.5 inline-block align-middle text-xs text-neutral-500"
              />
            ) : (
              <span className="font-bold">♪?</span>
            )}
          </button>
          <label className="flex items-center gap-1.5 text-xs text-neutral-500">
            every
            <select
              value={noteSync}
              onChange={(e) => setNoteSync(Number(e.target.value))}
              className={input}
              aria-label="auto key change interval"
            >
              <option value={0}>off</option>
              {[1, 2, 4, 8, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} beat{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => setDroneOn((v) => !v)}
            title="drone the current key on each downbeat"
            aria-pressed={droneOn}
            className={`rounded-md border px-2 py-1 text-xs ${
              droneOn
                ? "border-amber-500/60 text-amber-400"
                : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
            }`}
          >
            drone {droneOn ? "on" : "muted"}
          </button>
        </div>
        <button
          className="rounded-md border border-neutral-800 px-2.5 py-1.5 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
          onClick={() => setTunerOpen((o) => !o)}
          aria-expanded={tunerOpen}
        >
          {tunerOpen ? "▾" : "▸"} tuner
        </button>
        <div className="ml-auto flex gap-1.5 text-xs">
          <a
            className="rounded-md border border-neutral-800 bg-neutral-800/40 px-2 py-1 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            href="https://www.oolimo.com/en/guitar-chords/analyze"
            target="_blank"
            rel="noopener noreferrer"
          >
            chord analyzer ↗
          </a>
          <a
            className="rounded-md border border-neutral-800 bg-neutral-800/40 px-2 py-1 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
            href="https://www.all-guitar-chords.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            chords &amp; scales ↗
          </a>
        </div>
      </div>
      <div className="hidden lg:block">
        <Reveal open={tunerOpen}>
          <div className={`${card} mb-4`}>
            <Tuner />
          </div>
        </Reveal>
      </div>

      {unlockOpen && !unlocked && (
        <div className={`${card} mb-4`}>
          <p className="mb-2 text-sm text-neutral-400">
            Log in with your password — it opens your own practice log and stays saved on this device.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              placeholder="Password"
              className={`${input} flex-1`}
            />
            <button className={btn} onClick={submitPassword}>
              Log in
            </button>
            <button className={btn} onClick={() => setUnlockOpen(false)}>
              Cancel
            </button>
          </div>
          {pwError && <p className="mt-2 text-sm text-red-400">Wrong password</p>}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}

      {offline && (
        <div role="status" className="mb-4 rounded-md border border-amber-900 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
          Offline — edits are saved on this device and sync when you're back.
        </div>
      )}

      {fresh && (
        <div role="status" className="mb-4 rounded-md border border-amber-900 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
          Fresh preview — simulated first visit, nothing is saved.{" "}
          <a className="underline" href="/practice">
            back to your data
          </a>
        </div>
      )}

      {hintOpen && (
        <div className={`${card} mb-4 text-sm text-neutral-300`}>
          <p>
            <span className="font-medium">How it works:</span> tap an exercise to arm it →{" "}
            <span className="font-medium">Start session</span> runs the metronome and timer together →{" "}
            <span className="font-medium">Log it</span> saves your tempo and time.
          </p>
          <p className="mt-1.5 text-xs text-neutral-500">
            More, when you want it: the &quot;advanced&quot; line under Start (bpm · meter · sound) opens count-in, tempo trainer and more · ↓↑ in
            manage tracks down/up-stroke starts separately · “goal” draws a target line on the chart ·{" "}
            <span className="text-neutral-400">Log in</span> with your password to edit your own log.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              className="rounded-md bg-neutral-800 px-3 py-1 text-xs hover:bg-neutral-700"
              onClick={() => {
                if (!fresh) localStorage.setItem(HINT_KEY, "1");
                setHintOpen(false);
              }}
            >
              got it
            </button>
            {active.length > 0 && (
              <button
                className="rounded-md border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-500"
                onClick={() => {
                  setHintOpen(false);
                  setCoach(selectedEx ? 1 : 0);
                }}
              >
                show me ▸
              </button>
            )}
          </div>
        </div>
      )}

      {/* Day-done: tapping "done ✓" on the last queued exercise lands here. */}
      {dayDone && !armed && (
        <div className={`${card} mb-4 flex items-center justify-between gap-3 border-amber-500/40`}>
          <p className="text-sm">
            {/* The victory lap has to be earned — under 5 minutes it's just a log note. */}
            <span className="font-medium text-amber-400">
              {todayTotal >= 300 ? "Done for today ✓" : "Session logged ✓"}
            </span>{" "}
            {todayTotal > 0 && (
              <span className="text-neutral-400">
                <span className="tabular-nums text-neutral-200">{fmtDur(todayTotal)}</span> across{" "}
                {todayExCount} exercise{todayExCount === 1 ? "" : "s"}
                {streak > 1 && <> · {streak}-day streak</>}
              </span>
            )}
          </p>
          <button
            className="rounded px-1.5 text-lg leading-none text-neutral-500 hover:text-neutral-200"
            onClick={() => setDayDone(false)}
            aria-label="dismiss day summary"
          >
            ×
          </button>
        </div>
      )}

      {/* Armed = single centered column, hero above everything; browse = the
          familiar two-column desktop layout. */}
      <div className={armed ? "" : "lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-6"}>
        {/* ---- Tools column (browse) / full-width hero (armed) ---- */}
        <div className={armed ? "" : "lg:sticky lg:top-4"}>
          {/* Session hero: armed exercise + tempo + one primary control.
              Armed: always visible, the page's headline. Browse: always on
              desktop, expanded-only on mobile (the strip drives it). */}
          <section className={`${card} mb-4 border-amber-500/25 ${armed || metroOpen ? "" : "hidden lg:block"}`}>
            <div className="mb-3">
              {armed ? (
                <div className="flex items-start justify-between gap-2">
                  {/* Same spot arms and disarms: tapping the headline (or ×) relaxes the page. */}
                  <button
                    className="flex min-w-0 items-center gap-2 rounded text-left outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    onClick={() => setSelectedEx(null)}
                    title="tap to disarm"
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(armed.id) }} />
                    <span className="break-words text-lg font-semibold">{armed.name}</span>
                  </button>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {/* Straight to the next exercise in your order — no disarm
                        detour. On the last one, "done" wraps up the day. */}
                    {active.length > 1 && (
                      <>
                        <span className="text-[10px] tabular-nums text-neutral-600">
                          {queueIdx + 1} of {active.length}
                        </span>
                        <button
                          className="rounded border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
                          onClick={() => {
                            if (queueLast && allLoggedToday) {
                              setSelectedEx(null);
                              setDayDone(true);
                            } else {
                              // Wraps around until everything is logged today.
                              const nxt = active[(queueIdx + 1) % active.length];
                              armExercise(nxt, aggByDate(sessions ?? [], nxt.id));
                            }
                          }}
                          aria-label={queueLast && allLoggedToday ? "finish for today" : "arm next exercise"}
                        >
                          {queueLast && allLoggedToday ? "done ✓" : "next →"}
                        </button>
                      </>
                    )}
                    <button
                      className="rounded px-1.5 text-lg leading-none text-neutral-500 hover:text-neutral-200"
                      onClick={() => setSelectedEx(null)}
                      aria-label="disarm exercise"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <div className="break-words font-medium">
                  {/* One tap back into the routine: arm the first exercise
                      that hasn't been logged today. */}
                  {nextUp ? (
                    <button
                      className="flex w-full min-w-0 items-center gap-2 rounded text-left outline-none hover:text-white focus-visible:ring-1 focus-visible:ring-neutral-400"
                      onClick={() => armExercise(nextUp, aggByDate(sessions ?? [], nextUp.id))}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(nextUp.id) }} />
                      <span className="min-w-0 flex-1 break-words">
                        <span className="text-amber-400">▶</span> {loggedTodayIds.size > 0 ? "Resume" : "Start"}:{" "}
                        {nextUp.name}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-neutral-600">
                        {active.indexOf(nextUp) + 1} of {active.length}
                      </span>
                    </button>
                  ) : allLoggedToday ? (
                    <span className="text-neutral-300">
                      All logged today <span className="text-amber-400">✓</span>
                      <span className="ml-1.5 text-xs font-normal text-neutral-500">free play below</span>
                    </span>
                  ) : (
                    <span className="text-neutral-300">
                      Tap an exercise to arm it <span className="text-amber-400/80">↓</span>
                    </span>
                  )}
                </div>
              )}
              {selectedEx && exById.get(selectedEx)?.track_variants && (
                <div className="mt-1.5 flex gap-1">
                  {(["down", "up"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => selectVariant(v)}
                      aria-pressed={variant === v}
                      className={`rounded px-2 py-1 text-xs ${
                        variant === v
                          ? "bg-neutral-200 font-semibold text-neutral-950"
                          : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
                      }`}
                    >
                      {v === "down" ? "↓ down" : "↑ up"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* While a session runs the live timer takes over and the
                set-and-forget bpm number steps back. */}
            {/* Two aligned rows: numbers on top (bpm | timer), their small
                companions below (beat dots | "session" label). */}
            <div className="flex items-stretch justify-between">
              {heroTools.metronome && (
              <button
                className="flex flex-col justify-between rounded text-left outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                onClick={() => setTempoOpen((o) => !o)}
                aria-expanded={tempoOpen}
                title="adjust tempo"
              >
                <div className={`font-bold tabular-nums transition-all ${swRunning ? "text-2xl" : "text-3xl"}`}>
                  {bpm}
                  <span className="ml-1 text-sm font-normal text-neutral-500">bpm {tempoOpen ? "▾" : "▸"}</span>
                </div>
                {/* Beat dots live right under the number they describe; the
                    downbeat is amber even at rest so "1" reads at a glance. */}
                <div className="mt-1.5 flex items-center gap-2" aria-hidden="true">
                  {Array.from({ length: beatsPerBar }, (_, i) => (
                    <span
                      key={i}
                      className={`h-3.5 w-3.5 rounded-full transition-all ${
                        running && pulse === i
                          ? i === 0
                            ? "scale-125 bg-amber-400"
                            : "bg-neutral-200"
                          : i === 0
                            ? "bg-amber-500/40"
                            : "bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>
              </button>
              )}
              <div className="flex flex-col justify-between text-right">
                {/* Before the first Start this slot answers "where am I today?"
                    instead of showing a dead 0:00. */}
                <div
                  className={`font-bold tabular-nums transition-all ${
                    swRunning ? "text-5xl text-amber-400" : swElapsed > 0 ? "text-3xl" : "text-3xl text-neutral-600"
                  }`}
                >
                  {swRunning || swElapsed > 0
                    ? fmtSecs(swElapsed / 1000)
                    : selTodaySecs > 0
                      ? fmtDur(selTodaySecs)
                      : fmtSecs(0)}
                </div>
                <div className={`text-[10px] ${countingIn ? "text-amber-400" : "text-neutral-600"}`}>
                  {countingIn
                    ? "count-in…"
                    : swRunning || swElapsed > 0
                      ? "session"
                      : selTodaySecs > 0
                        ? "today"
                        : armedLast
                          ? `last · ${fmtAgg(armedLast)}`
                          : "session"}
                </div>
              </div>
            </div>
            {/* Tempo nudge on arm: dial already sits at last time's bpm, these
                chips ask whether today matches it or pushes on. */}
            {armed && heroTools.metronome && !bpmPromptSeen && !armedToday && armedLast && armedLast.bpm > 0 && !swRunning && swElapsed === 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
                <span>
                  last time <span className="tabular-nums text-neutral-400">{armedLast.bpm} bpm</span> —
                </span>
                <button className={btn} onClick={() => setBpmPromptSeen(true)}>
                  same
                </button>
                {[2, 5].map((d) => (
                  <button
                    key={d}
                    className={btn}
                    onClick={() => {
                      nudgeBpm(d);
                      setBpmPromptSeen(true);
                    }}
                  >
                    +{d}
                  </button>
                ))}
              </div>
            )}
            {/* Goal in sight: how today's dial compares to the exercise's target. */}
            {armed?.target_bpm && heroTools.metronome ? (
              <div className="mt-2.5">
                <div className="h-1 overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-amber-500/70 transition-all"
                    style={{ width: `${Math.min(100, (bpm / armed.target_bpm) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] tabular-nums text-neutral-600">
                  {bpm} / {armed.target_bpm} bpm target
                </div>
              </div>
            ) : null}
            {/* The full ruler + tap/nudge controls unfold from the bpm number;
                day-to-day the tempo is already right and stays out of the way. */}
            {heroTools.metronome && (
            <Reveal open={tempoOpen}>
            <div>
            <BpmRuler value={bpm} onChange={setBpm} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className={btn} onClick={tapTempo}>
                Tap
              </button>
              <div className="flex gap-1">
                {[-5, -1, +1, +5].map((d) => (
                  <button key={d} className={btn} onClick={() => nudgeBpm(d)} aria-label={`${d > 0 ? "+" : ""}${d} bpm`}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>
            </div>
            </Reveal>
            )}
            <div className="mt-3 flex items-center gap-2" ref={coachStartRef}>
              {sessionBtn("flex-1 py-3")}
              {swElapsed > 0 && !swRunning && (
                <>
                  <button
                    className="rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                    onClick={swLog}
                  >
                    Log it
                  </button>
                  <button className={btn} onClick={swReset}>
                    Reset
                  </button>
                </>
              )}
            </div>
            {/* Random key: only for exercises that ask for it (or freeform).
                Desktop has it in the tool strip up top — this row is the
                mobile home. */}
            {heroTools.random_key && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-800 px-2.5 py-1.5 lg:hidden">
              {/* Group label so the interval/drone/note trio reads as one tool. */}
              <span className="text-[10px] uppercase tracking-widest text-neutral-600">random key</span>
              <label className="flex items-center gap-1.5 text-xs text-neutral-500">
                every
                <select
                  value={noteSync}
                  onChange={(e) => setNoteSync(Number(e.target.value))}
                  className={input}
                  aria-label="auto key change interval"
                >
                  <option value={0}>off</option>
                  {[1, 2, 4, 8, 16, 32].map((n) => (
                    <option key={n} value={n}>
                      {n} beat{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => setDroneOn((v) => !v)}
                title="drone the current key on each downbeat"
                aria-pressed={droneOn}
                className={`rounded-md border px-2 py-1 text-xs ${
                  droneOn
                    ? "border-amber-500/60 text-amber-400"
                    : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
                }`}
              >
                drone {droneOn ? "on" : "muted"}
              </button>
              <button
                onClick={advanceNote}
                title="press N or tap for a new key"
                aria-label="new random key"
                className="min-w-[3.5rem] rounded-md bg-neutral-800 px-3 py-1 text-center hover:bg-neutral-700"
              >
                {noteCur ? (
                  <NoteMorph
                    cur={noteCur.label}
                    next={noteSync > 0 ? noteNext?.label ?? null : null}
                    morphMs={noteMorph}
                    curClass="inline-block text-lg font-bold"
                    nextClass="ml-1.5 inline-block align-middle text-xs text-neutral-500"
                  />
                ) : (
                  <span className="text-lg font-bold">♪?</span>
                )}
              </button>
            </div>
            )}
            {/* The current config is the options toggle: reading it tells you
                what Start will do, tapping it opens the knobs that change it.
                "Metronome only" sits demoted beside it — a mode, not a headline.
                Hidden in freeform for brand-new players (progressive reveal). */}
            {(armed || seasoned) && (
            <>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                className="min-w-0 truncate rounded text-left text-xs text-neutral-500 outline-none hover:text-neutral-300 focus-visible:ring-1 focus-visible:ring-neutral-500"
                onClick={() => setExtrasOpen((o) => !o)}
                aria-expanded={extrasOpen}
              >
                <span className="text-xs">{extrasOpen ? "▾" : "▸"}</span>{" "}
                {heroTools.metronome ? (
                  <>
                    {[
                      `${bpm} bpm`,
                      `${beatsPerBar}/4`,
                      sound,
                      countIn ? "count-in" : "",
                      trainer ? `+${trainerAdd} every ${trainerBars} bars` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    <span className="text-neutral-600"> · advanced</span>
                  </>
                ) : (
                  "advanced"
                )}
              </button>
              {heroTools.metronome && (
                <button
                  className={`shrink-0 rounded-md border px-2 py-1 text-[11px] ${
                    running
                      ? "border-amber-500/50 text-amber-400 hover:bg-neutral-800"
                      : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
                  }`}
                  onClick={toggleMetronome}
                  aria-pressed={running}
                >
                  {running ? "stop metronome" : "metronome only"}
                </button>
              )}
            </div>
            {/* Session extras: opt-in behaviors for the Start button. Inset
                sub-panel so the pile of small controls reads as one group. */}
            <Reveal open={extrasOpen}>
            <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-2.5">
            {heroTools.metronome && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={countIn}
                  onChange={(e) => setCountIn(e.target.checked)}
                />
                count-in bar
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={trainer}
                  onChange={(e) => setTrainer(e.target.checked)}
                />
                tempo trainer
              </label>
              {trainer && (
                <span className="flex items-center gap-1 text-neutral-500">
                  +
                  <select
                    value={trainerAdd}
                    onChange={(e) => setTrainerAdd(Number(e.target.value))}
                    className={input}
                    aria-label="bpm increase"
                  >
                    {[1, 2, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  bpm every
                  <select
                    value={trainerBars}
                    onChange={(e) => setTrainerBars(Number(e.target.value))}
                    className={input}
                    aria-label="bars between increases"
                  >
                    {[2, 4, 8, 16].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  bars
                </span>
              )}
            </div>
            )}
            <div
              className={`flex flex-wrap items-center gap-3 ${
                heroTools.metronome ? "mt-2.5 border-t border-neutral-800/60 pt-2.5" : ""
              }`}
            >
              {heroTools.metronome && (
              <>
              <select
                value={beatsPerBar}
                onChange={(e) => setBeatsPerBar(Number(e.target.value))}
                className={input}
                aria-label="beats per bar"
              >
                {[2, 3, 4, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}/4
                  </option>
                ))}
              </select>
              <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
                {(["beep", "wood", "tick"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSound(s)}
                    aria-pressed={sound === s}
                    className={`px-2.5 py-1.5 ${sound === s ? "bg-neutral-200 text-neutral-950" : "text-neutral-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              </>
              )}
              <label className="flex items-center gap-1 text-xs text-neutral-500">
                🔊
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  className="w-24 accent-amber-500"
                  aria-label="volume"
                />
              </label>
            </div>
            </div>
            </Reveal>
            </>
            )}
            {/* The write-up and stats: auto-open while the exercise is new,
                tucked behind "details" once it's part of the routine. */}
            {armed && (
              <>
                <button
                  className="mt-2 block rounded text-xs text-neutral-500 outline-none hover:text-neutral-300 focus-visible:ring-1 focus-visible:ring-neutral-500"
                  onClick={() => setDetailsOpen((o) => !(o ?? armedAggs.length < 3))}
                  aria-expanded={detailsOpen ?? armedAggs.length < 3}
                >
                  <span className="text-xs">{(detailsOpen ?? armedAggs.length < 3) ? "▾" : "▸"}</span> details
                </button>
                <Reveal open={detailsOpen ?? armedAggs.length < 3}>
                  <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-950/50 p-2.5">
                    {armed.description && (
                      <p className="whitespace-pre-wrap text-sm text-neutral-300">{armed.description}</p>
                    )}
                    {armed.ref_url && (
                      <button
                        className={`rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-xs hover:border-neutral-400 hover:bg-neutral-700 ${armed.description ? "mt-1.5" : ""}`}
                        onClick={() => openRef(armed.ref_url!)}
                      >
                        {isUpload(armed.ref_url) ? "📄 reference" : "🔗 reference"}
                      </button>
                    )}
                    {armedLast && (
                      <div className="mt-1.5 text-xs text-neutral-500">
                        <span className="text-neutral-600">{fmtDateShort(armedLast.date)} </span>
                        <span className="tabular-nums text-neutral-400">{fmtAgg(armedLast)}</span>
                        <span className="text-neutral-600"> · today </span>
                        {armedToday ? (
                          <span className="tabular-nums text-neutral-400">{fmtAgg(armedToday)}</span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                        {armedDelta !== null && armedDelta !== 0 && (
                          <span className={`ml-1 ${armedDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                            {armedDelta > 0 ? "▲" : "▼"}
                            {Math.abs(armedDelta)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Reveal>
              </>
            )}
          </section>

          {/* The random key generator lives inside the session hero now,
              shown only for exercises that flag it (or freeform practice). */}

          {/* Tools (tuner) here on mobile only — desktop has the strip. */}
          {!armed && <div className="lg:hidden">{toolsSection}</div>}
        </div>

        {/* ---- Content column ---- */}
        <div>
          {/* Armed: the other exercises shrink to one-tap chips right under
              the hero; the full cards wait in browse mode. */}
          {armed && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {active
                .filter((e) => e.id !== armed.id)
                .map((e) => (
                  <button
                    key={e.id}
                    onClick={() => armExercise(e, aggByDate(sessions ?? [], e.id))}
                    draggable={unlocked}
                    onDragStart={() => {
                      dragEx.current = e.id;
                    }}
                    onDragOver={(ev) => ev.preventDefault()}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      if (dragEx.current && dragEx.current !== e.id) reorder(dragEx.current, e.id);
                      dragEx.current = null;
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-600"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: colorOf(e.id) }} />
                    {e.name}
                  </button>
                ))}
            </div>
          )}
          {!armed && (
          <>
          {/* Exercise cards: last vs today at a glance; tap = arm stopwatch + metronome. */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-400">Exercises</h2>
            {/* Chips, not footnote links — the skill tree is a whole feature
                and manage is the main edit surface. */}
            <div className="flex gap-2">
              <a
                className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500"
                href="/practice/tree"
              >
                🌳 syllabus
              </a>
              <button
                className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500"
                onClick={() => setManageOpen((o) => !o)}
              >
                {manageOpen ? "close manage" : "manage"}
              </button>
            </div>
          </div>
          {/* One column in queue order — the list IS the routine, and uniform
              cards read as a set instead of a masonry puzzle. */}
          <section className="mb-4" ref={coachListRef}>
            {/* Said once, up here — the cards below just show a quiet "—". */}
            {!loading && (sessions ?? []).length === 0 && active.length > 0 && (
              <p className="mb-2 text-xs text-neutral-600">
                Nothing logged yet — tap an exercise to arm it, then Start session.
              </p>
            )}
            {active.map((ex) => {
              const aggs = aggByDate(sessions ?? [], ex.id);
              const todayAgg = aggs[0]?.date === today ? aggs[0] : null;
              const lastAgg = todayAgg ? aggs[1] : aggs[0];
              // Trend of the most recent day vs the one before it.
              const latest = aggs[0];
              const prev = aggs[1];
              const timeDelta =
                latest && prev && latest.seconds > 0 && prev.seconds > 0
                  ? (latest.seconds - prev.seconds) / prev.seconds
                  : null;
              const bpmDelta = latest && prev && latest.bpm > 0 && prev.bpm > 0 ? latest.bpm - prev.bpm : null;
              const selected = selectedEx === ex.id;
              const expanded = expandedEx === ex.id;
              return (
                <div
                  key={ex.id}
                  className={`mb-2 cursor-pointer rounded-xl border bg-neutral-900 p-3 transition-colors ${
                    selected ? "" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                  style={selected ? { borderColor: colorOf(ex.id) } : undefined}
                  onClick={() => armExercise(ex, aggs)}
                  draggable={unlocked}
                  onDragStart={() => {
                    dragEx.current = ex.id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragEx.current && dragEx.current !== ex.id) reorder(dragEx.current, ex.id);
                    dragEx.current = null;
                  }}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded text-left outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    onClick={() => armExercise(ex, aggs)}
                    aria-pressed={selected}
                  >
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorOf(ex.id) }} />
                    <span className="min-w-0 flex-1 break-words font-medium">{ex.name}</span>
                    {ex.ref_url && (
                      <span
                        role="button"
                        tabIndex={0}
                        title={
                          isUpload(ex.ref_url)
                            ? "Attached reference — click to view"
                            : "Reference link — opens in a new tab"
                        }
                        className="rounded-md border border-neutral-700 bg-neutral-800/60 px-1.5 py-0.5 text-xs hover:border-neutral-400 hover:bg-neutral-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoverRef(null);
                          openRef(ex.ref_url!);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && openRef(ex.ref_url!)}
                        onMouseEnter={() => isUpload(ex.ref_url!) && setHoverRef(ex.ref_url!)}
                        onMouseLeave={() => setHoverRef(null)}
                      >
                        {isUpload(ex.ref_url) ? "📄" : "🔗"}
                      </span>
                    )}
                  </button>
                  {/* Numbers first — they're what a glance is for; the prose
                      teaser follows and the full text sits behind the arrow.
                      Unpracticed cards keep the row (with —) so every card in
                      the single-column list shares one silhouette. */}
                  {ex.track_variants ? (
                    // One row per stroke-start so both tempos are visible at a glance.
                    <div className="mt-2 space-y-0.5 text-sm">
                      {(["down", "up"] as const).map((v) => {
                        const vAggs = aggByDate(sessions ?? [], ex.id, v);
                        const vToday = vAggs[0]?.date === today ? vAggs[0] : null;
                        const vLast = vToday ? vAggs[1] : vAggs[0];
                        // Each stroke-start compares against its own previous
                        // day — mixing them would compare different tempos.
                        const vDelta =
                          vAggs[0] && vAggs[1] && vAggs[0].bpm > 0 && vAggs[1].bpm > 0
                            ? vAggs[0].bpm - vAggs[1].bpm
                            : null;
                        return (
                          <div key={v} className="grid grid-cols-[1rem_1fr_1fr] gap-1">
                            <span className="text-neutral-500">{v === "down" ? "↓" : "↑"}</span>
                            <span className="text-neutral-400">
                              <span className="text-xs text-neutral-600">
                                {vLast ? fmtDateShort(vLast.date) : "last"}{" "}
                              </span>
                              {vLast ? (
                                <span className="tabular-nums">{fmtAgg(vLast)}</span>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                            </span>
                            <span>
                              <span className="text-xs text-neutral-600">today </span>
                              {vToday ? (
                                <span className="tabular-nums">{fmtAgg(vToday)}</span>
                              ) : (
                                <span className="text-neutral-600">—</span>
                              )}
                              {vDelta !== null && vDelta !== 0 && (
                                <span className={`ml-1 text-xs ${vDelta > 0 ? "text-green-400" : "text-red-400"}`}>
                                  {vDelta > 0 ? "▲" : "▼"}{Math.abs(vDelta)}
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-1 text-sm">
                      <div className="text-neutral-400">
                        <span className="text-xs text-neutral-600">
                          {lastAgg ? fmtDateShort(lastAgg.date) : "last"}{" "}
                        </span>
                        {lastAgg ? (
                          <span className="tabular-nums">
                            {lastAgg.bpm > 0 && `${lastAgg.bpm} bpm · `}
                            {lastAgg.seconds > 0 && fmtDur(lastAgg.seconds)}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-neutral-600">today </span>
                        {todayAgg ? (
                          <span className="tabular-nums">
                            {todayAgg.bpm > 0 && `${todayAgg.bpm} bpm · `}
                            {todayAgg.seconds > 0 && fmtDur(todayAgg.seconds)}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(timeDelta !== null || bpmDelta !== null) && (
                    <div className="mt-1 flex gap-3 text-xs">
                      {/* Tracked exercises get per-variant deltas in the rows
                          above — a combined one would compare ↓ vs ↑ days. */}
                      {!ex.track_variants && bpmDelta !== null && bpmDelta !== 0 && (
                        <span className={bpmDelta > 0 ? "text-green-400" : "text-red-400"}>
                          {bpmDelta > 0 ? "▲" : "▼"} {Math.abs(bpmDelta)} bpm
                        </span>
                      )}
                      {/* Practicing more or less isn't better or worse, so the
                          time trend stays neutral. */}
                      {timeDelta !== null && Math.abs(timeDelta) >= 0.005 && (
                        <span className="text-neutral-500">
                          {timeDelta < 0 ? "▼" : "▲"} {Math.abs(Math.round(timeDelta * 100))}% time
                        </span>
                      )}
                    </div>
                  )}
                  {ex.description && !expanded && (
                    // Two-line teaser; long text fades out instead of chopping
                    // mid-sentence — the arrow's detail view has the rest.
                    <p
                      className={`mt-1.5 line-clamp-2 whitespace-pre-line text-xs text-neutral-500 ${
                        ex.description.length > 90
                          ? "[mask-image:linear-gradient(180deg,#000_45%,#00000030_100%)]"
                          : ""
                      }`}
                    >
                      {ex.description}
                    </p>
                  )}
                  {/* Expand affordance along the bottom edge — full-width and
                      tall enough to hit with a thumb. Detail opens BELOW the
                      arrow so the toggle never moves: click the same spot
                      twice, no chasing the minimize button. */}
                  <button
                    className={`-mx-3 mt-0.5 w-[calc(100%+1.5rem)] py-2 text-center text-xs text-neutral-600 hover:text-neutral-300 ${expanded ? "" : "-mb-3"}`}
                    title="History & full description"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedEx(expanded ? null : ex.id);
                    }}
                  >
                    {expanded ? "▴" : "▾"}
                  </button>
                  <Reveal open={expanded}>
                    <div className="border-t border-neutral-800 pt-2 text-xs text-neutral-400">
                      {ex.description && (
                        <div className="mb-2">
                          <DescriptionBody text={ex.description} />
                        </div>
                      )}
                      {aggs.slice(0, 7).map((a) => (
                        <div key={a.date} className="flex justify-between py-0.5 tabular-nums">
                          <span>{fmtDateShort(a.date)}</span>
                          <span>{a.bpm > 0 ? `${a.bpm} bpm` : ""}</span>
                          <span>{a.seconds > 0 ? fmtDur(a.seconds) : ""}</span>
                        </div>
                      ))}
                      {aggs.length === 0 && <p className="py-1 text-neutral-600">no sessions yet</p>}
                    </div>
                  </Reveal>
                </div>
              );
            })}
            {!loading && active.length === 0 && (
              <div className={`${card} text-sm`}>
                {/* An empty screen is an invitation to act: the tree's opening
                    moves, one per branch, so the first step is a tap. */}
                <p className="text-neutral-300">Fresh start — pick a first exercise:</p>
                {starters === null ? (
                  <p className="mt-2 text-xs text-neutral-600">loading suggestions…</p>
                ) : starters.length === 0 ? (
                  <p className="mt-2 text-xs text-neutral-600">Open “manage” above to add your first exercise.</p>
                ) : (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {starters.map((n) => (
                      <button
                        key={n.id}
                        disabled={(!unlocked && !fresh) || starterBusy !== null}
                        onClick={() => void startStarter(n.id)}
                        className="rounded-md border border-neutral-700 bg-neutral-800/40 px-3 py-2 text-left hover:border-neutral-500 hover:bg-neutral-800 disabled:opacity-50"
                      >
                        <span className="font-medium">{starterBusy === n.id ? "adding…" : n.name}</span>
                        <span className="ml-1.5 text-xs text-neutral-500">{STARTER_BRANCHES[n.branch] ?? n.branch}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500"
                    href="/practice/tree"
                  >
                    🌳 or browse the full syllabus
                  </a>
                  {!unlocked && !fresh && <span className="text-xs text-neutral-600">log in above to add exercises</span>}
                </div>
              </div>
            )}
          </section>

          {/* Manage panel: opened from the small link by the Exercises header. */}
          {manageOpen && (
          <section className={card}>
            <button
              className="flex w-full items-center justify-between text-sm font-medium text-neutral-400"
              onClick={() => setManageOpen(false)}
            >
              Manage exercises
              <span className="text-xs">▾</span>
            </button>
              <div className="mt-3">
                {(exercises ?? []).map((ex) => (
                  <div key={ex.id} className="border-b border-neutral-800/60">
                  <div className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: colorOf(ex.id) }} />
                    <span className={`flex-1 ${ex.archived ? "text-neutral-600 line-through" : ""}`}>{ex.name}</span>
                    {unlocked && (
                      <>
                        <button
                          className="px-0.5 text-xs text-neutral-500 hover:text-neutral-200"
                          onClick={() => moveBy(ex, -1)}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="px-0.5 text-xs text-neutral-500 hover:text-neutral-200"
                          onClick={() => moveBy(ex, 1)}
                          title="Move down"
                        >
                          ↓
                        </button>
                        {uploading === ex.id ? (
                          <span className="text-xs text-neutral-500">uploading…</span>
                        ) : ex.ref_url ? (
                          <>
                            <button
                              className="text-xs text-neutral-500 hover:text-neutral-200"
                              onClick={() => openRef(ex.ref_url!)}
                            >
                              ref
                            </button>
                            <button
                              className="text-xs text-neutral-500 hover:text-red-400"
                              title="Remove reference"
                              onClick={() =>
                                confirm(`Remove the reference from “${ex.name}”? This can't be undone.`) &&
                                patchExercise(ex.id, { ref_url: null })
                              }
                            >
                              ×ref
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="text-xs text-neutral-500 hover:text-neutral-200"
                              onClick={() => pickFile(ex.id)}
                            >
                              attach
                            </button>
                            <button
                              className="text-xs text-neutral-500 hover:text-neutral-200"
                              onClick={() => linkRef(ex)}
                            >
                              link
                            </button>
                          </>
                        )}
                        <button
                          className={`text-xs ${
                            ex.track_variants ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"
                          }`}
                          title="Track down/up-stroke starts separately"
                          onClick={() => patchExercise(ex.id, { track_variants: !ex.track_variants })}
                        >
                          ↓↑
                        </button>
                        {/* Which tools this exercise puts in the session hero. */}
                        <button
                          className={`text-xs ${
                            toolsOf(ex).metronome ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"
                          }`}
                          title="Metronome in the session card"
                          aria-pressed={toolsOf(ex).metronome}
                          onClick={() => patchExercise(ex.id, { tools: { ...toolsOf(ex), metronome: !toolsOf(ex).metronome } })}
                        >
                          met
                        </button>
                        <button
                          className={`text-xs ${
                            toolsOf(ex).random_key ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"
                          }`}
                          title="Random key generator in the session card"
                          aria-pressed={toolsOf(ex).random_key}
                          onClick={() => patchExercise(ex.id, { tools: { ...toolsOf(ex), random_key: !toolsOf(ex).random_key } })}
                        >
                          key
                        </button>
                        <button
                          className={`text-xs ${
                            ex.target_bpm ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"
                          }`}
                          title="Target BPM — draws a goal line on the chart"
                          onClick={() => {
                            const t = prompt("Target BPM (empty clears)", ex.target_bpm ? String(ex.target_bpm) : "");
                            if (t === null) return;
                            void patchExercise(ex.id, { target_bpm: t.trim() ? Number(t) : null } as Partial<Exercise>);
                          }}
                        >
                          goal
                        </button>
                        <button
                          className="text-xs text-neutral-500 hover:text-neutral-200"
                          onClick={() => {
                            const name = prompt("Rename exercise", ex.name);
                            if (name?.trim()) void patchExercise(ex.id, { name: name.trim() });
                          }}
                        >
                          rename
                        </button>
                        <button
                          className={`text-xs ${
                            descEdit?.id === ex.id ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-200"
                          }`}
                          onClick={() =>
                            setDescEdit(descEdit?.id === ex.id ? null : { id: ex.id, text: ex.description ?? "" })
                          }
                        >
                          desc
                        </button>
                        <button
                          className="text-xs text-neutral-500 hover:text-neutral-200"
                          onClick={() =>
                            (ex.archived || confirm(`Archive “${ex.name}”? Its history stays and it can be restored here.`)) &&
                            patchExercise(ex.id, { archived: !ex.archived })
                          }
                        >
                          {ex.archived ? "restore" : "archive"}
                        </button>
                      </>
                    )}
                  </div>
                  {descEdit?.id === ex.id && (
                    <div className="mb-2 pl-4">
                      <textarea
                        autoFocus
                        rows={3}
                        value={descEdit.text}
                        onChange={(e) => setDescEdit({ id: ex.id, text: e.target.value })}
                        placeholder="Description — what to focus on, steps, etc. (empty clears)"
                        className={`${input} w-full resize-y`}
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-950 hover:bg-white"
                          onClick={() => {
                            void patchExercise(ex.id, { description: descEdit.text });
                            setDescEdit(null);
                          }}
                        >
                          Save
                        </button>
                        <button
                          className="rounded-md bg-neutral-800 px-3 py-1 text-xs hover:bg-neutral-700"
                          onClick={() => setDescEdit(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                ))}
                <div className="mt-2 flex gap-2">
                  <input
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addExercise()}
                    placeholder="New exercise"
                    className={`${input} flex-1`}
                  />
                  <button className={btn} onClick={addExercise}>
                    Add
                  </button>
                </div>
                {/* Which tools the new exercise shows in the session hero. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                  with:
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="accent-amber-500"
                      checked={newExTools.metronome}
                      onChange={(e) => setNewExTools((t) => ({ ...t, metronome: e.target.checked }))}
                    />
                    metronome
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="accent-amber-500"
                      checked={newExTools.random_key}
                      onChange={(e) => setNewExTools((t) => ({ ...t, random_key: e.target.checked }))}
                    />
                    random key
                  </label>
                </div>
              </div>
          </section>
          )}
          </>
          )}

          {entryForm}

          {/* Progress: a real chart once ~5 days exist; before that a week
              strip + streak, which says more than a scatter of single dots. */}
          {armed && !(!loading && byDateDesc.length === 0) && (
            <button
              className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
              onClick={() => setOpenPanels((p) => ({ ...p, progress: !p.progress }))}
              aria-expanded={openPanels.progress}
            >
              <span className="text-xs">{openPanels.progress ? "▾" : "▸"}</span> Progress
            </button>
          )}
          <Reveal open={!armed || openPanels.progress}>
          <section className={`${card} mb-4 ${!loading && byDateDesc.length === 0 ? "hidden" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-400">Progress</h2>
              {chartReady && (
                <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
                  {(["seconds", "bpm"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      className={`px-3 py-1 ${metric === m ? "bg-neutral-200 text-neutral-950" : "text-neutral-400"}`}
                    >
                      {m === "seconds" ? "Time" : "BPM"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>
            ) : !chartReady ? (
              <div>
                <div className="flex gap-1.5">
                  {last7.map((d) => (
                    <div key={d.iso} className="flex-1 text-center">
                      <div
                        className={`h-8 rounded ${
                          d.done ? "bg-amber-500/80" : "bg-neutral-800"
                        } ${d.iso === today ? "ring-1 ring-neutral-600" : ""}`}
                      />
                      <div className="mt-1 text-[10px] text-neutral-600">{d.label}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-neutral-600">
                  {streak > 1 ? `${streak}-day streak · ` : ""}charts unlock after 5 practiced days ({dates.length}/5)
                </p>
              </div>
            ) : (
              <>
                <Chart series={displaySeries} fmtY={metric === "seconds" ? fmtDur : (y) => String(Math.round(y))} />
                {/* Legend doubles as a filter: tap an entry to isolate it.
                    Variant series get their own entries so the solid (↓ down)
                    vs dashed (↑ up) styling is explained where it's seen. */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {series.map((s) => {
                    const dim = focusEx && focusEx !== s.name;
                    return (
                      <button
                        key={s.name}
                        onClick={() => setFocusEx(focusEx === s.name ? null : s.name)}
                        className={`flex items-center gap-1.5 text-xs ${dim ? "text-neutral-600" : "text-neutral-400"}`}
                      >
                        {!s.dash ? (
                          <span className="h-2 w-4 rounded-sm" style={{ background: dim ? s.color + "40" : s.color }} />
                        ) : (
                          <span
                            className="w-4 border-t-2 border-dashed"
                            style={{ borderColor: dim ? s.color + "40" : s.color }}
                          />
                        )}
                        {s.name}
                      </button>
                    );
                  })}
                </div>
                {/* Daily heatmap: practiced days at a glance. */}
                <div className="mt-4 overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* Month labels sit over the first column of each month. */}
                    <div className="mb-1 ml-[19px] flex text-[9px] leading-none text-neutral-600">
                      {heatWeeks.map((week, i) => {
                        const month = week[0].iso.slice(5, 7);
                        const newMonth = i > 0 && heatWeeks[i - 1][0].iso.slice(5, 7) !== month;
                        return (
                          <span key={i} className="w-[13px] shrink-0 overflow-visible whitespace-nowrap">
                            {(i === 0 || newMonth) &&
                              new Date(week[0].iso + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}
                          </span>
                        );
                      })}
                    </div>
                    <div className="flex gap-[3px]">
                      <div className="flex w-4 shrink-0 flex-col gap-[3px] text-[9px] leading-none text-neutral-600">
                        {["", "M", "", "W", "", "F", ""].map((l, i) => (
                          <span key={i} className="flex h-2.5 items-center">
                            {l}
                          </span>
                        ))}
                      </div>
                      {heatWeeks.map((week, i) => (
                        <div key={i} className="flex flex-col gap-[3px]">
                          {week.map((d) => (
                            <span
                              key={d.iso}
                              title={`${fmtDateShort(d.iso)}${d.secs > 0 ? ` · ${fmtDur(d.secs)}` : ""}`}
                              className="h-2.5 w-2.5 rounded-[2px]"
                              style={{
                                background: d.future
                                  ? "transparent"
                                  : d.secs === 0
                                    ? "#26262666"
                                    : `rgba(245,158,11,${0.25 + 0.75 * Math.min(1, d.secs / heatMax)})`,
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex items-center justify-end gap-[3px] text-[9px] text-neutral-600">
                      less
                      {["#26262666", "rgba(245,158,11,0.4)", "rgba(245,158,11,0.7)", "rgba(245,158,11,1)"].map((c) => (
                        <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
                      ))}
                      more
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Lifetime totals, relocated from the page footer so the bottom
                of the page stays calm. */}
            {!loading && totalSecs > 0 && (
              <p className="mt-3 border-t border-neutral-800/60 pt-2 text-[10px] leading-relaxed text-neutral-600">
                this week <span className="tabular-nums">{fmtDur(weekSecs)}</span> · all-time{" "}
                <span className="tabular-nums">{fmtDur(totalSecs)}</span> · days practiced {daysPracticed} · best
                streak {bestStreak} · avg <span className="tabular-nums">{fmtDur(totalSecs / daysPracticed)}</span>/day
              </p>
            )}
          </section>
          </Reveal>

          {/* Log */}
          {armed && (
            <button
              className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
              onClick={() => setOpenPanels((p) => ({ ...p, log: !p.log }))}
              aria-expanded={openPanels.log}
            >
              <span className="text-xs">{openPanels.log ? "▾" : "▸"}</span> Log
            </button>
          )}
          <Reveal open={!armed || openPanels.log}>
          <section className={`${card} mb-4`}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-400">Log</h2>
              <div className="flex gap-3">
                {byDateDesc.length > 0 && (
                  <button className="text-xs text-neutral-500 underline hover:text-neutral-300" onClick={exportCsv}>
                    export csv
                  </button>
                )}
                <button
                  className="text-xs text-neutral-400 underline"
                  onClick={() =>
                    requireUnlock() &&
                    setForm({ exercise_id: selectedEx ?? "", date: todayISO(), bpm: "", dur: "", note: "" })
                  }
                >
                  + add entry
                </button>
              </div>
            </div>
            {!loading && byDateDesc.length === 0 && (
              <p className="text-sm text-neutral-600">Nothing logged yet.</p>
            )}
            {/* Collapsed by default: a couple of entries fading out under an
                expand arrow — the log is a receipt, not the main event. */}
            <div
              ref={logRef}
              className="relative overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                maxHeight:
                  byDateDesc.length > 3
                    ? logOpen
                      ? logRef.current?.scrollHeight // real height, so the mask lerps instead of snapping
                      : 176
                    : undefined,
              }}
            >
            {dates.map((date) => {
              const daySessions = byDateDesc.filter((s) => s.date === date);
              const daySecs = daySessions.reduce((t, s) => t + (s.seconds ?? 0), 0);
              return (
                <div key={date} className="mb-3">
                  {/* The year is noise for recent entries; the day's total
                      lives up here so it reads without adding rows. */}
                  <h3 className="mb-1 flex items-baseline justify-between text-xs font-semibold text-neutral-500">
                    <span>
                      {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: "numeric" as const } : {}),
                      })}
                    </span>
                    {daySecs > 0 && <span className="font-normal tabular-nums">{fmtDur(daySecs)}</span>}
                  </h3>
                  {daySessions.map((s) => (
                    <div key={s.id} className="group border-b border-neutral-800/60 py-1.5 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span
                          className="h-2 w-2 shrink-0 self-center rounded-full"
                          style={{ background: colorOf(s.exercise_id) }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {/* One exercise total? The dot suffices — repeating
                              the name every row says nothing. */}
                          {manyEx && (exById.get(s.exercise_id)?.name ?? "?")}
                          {s.variant && (
                            <span className={`text-xs text-neutral-500 ${manyEx ? "ml-1" : ""}`}>
                              {s.variant === "up" ? "↑ up" : "↓ down"}
                            </span>
                          )}
                        </span>
                        {pbIds.has(s.id) && (
                          <span className="text-xs text-amber-400" title="personal best at the time">
                            ✦ PB
                          </span>
                        )}
                        <span className="tabular-nums text-neutral-400">{s.bpm != null ? `${s.bpm} bpm` : ""}</span>
                        <span className="w-14 text-right tabular-nums">
                          {s.seconds != null ? fmtDur(s.seconds) : ""}
                        </span>
                        {/* Faint but always visible — fully hidden controls
                            made mistakes look undeletable on desktop. */}
                        {unlocked && (
                          <span className="flex gap-1.5 text-xs transition-opacity [@media(hover:hover)]:opacity-40 [@media(hover:hover)]:group-hover:opacity-100">
                            <button
                              className="text-neutral-500 hover:text-neutral-200"
                              onClick={() =>
                                setForm({
                                  id: s.id,
                                  exercise_id: s.exercise_id,
                                  date: s.date,
                                  bpm: s.bpm != null ? String(s.bpm) : "",
                                  dur: s.seconds != null ? fmtSecs(s.seconds) : "",
                                  note: s.note ?? "",
                                  variant: s.variant ?? "",
                                })
                              }
                            >
                              edit
                            </button>
                            <button
                              className="text-neutral-500 hover:text-red-400"
                              onClick={() => deleteSession(s.id)}
                            >
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                      {/* Notes are the part written by a human — full line,
                          readable color, never truncated. */}
                      {s.note && <p className="pl-4 text-xs text-neutral-300">{s.note}</p>}
                    </div>
                  ))}
                </div>
              );
            })}
            {byDateDesc.length > 3 && (
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-900 to-transparent transition-opacity duration-500 ${logOpen ? "opacity-0" : "opacity-100"}`}
              />
            )}
            </div>
            {byDateDesc.length > 3 && (
              <button
                className="-mx-4 -mb-4 w-[calc(100%+2rem)] py-2 text-center text-xs text-neutral-500 hover:text-neutral-300"
                onClick={() => setLogOpen((o) => !o)}
              >
                {logOpen ? "▴ collapse" : "▾ show all"}
              </button>
            )}
          </section>
          </Reveal>

          {/* Tools retract behind a header while armed — mobile only; the
              desktop strip keeps them one click away at all times. */}
          {armed && (
            <div className="lg:hidden">
              <button
                className="mb-1 flex items-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
                onClick={() => setOpenPanels((p) => ({ ...p, tools: !p.tools }))}
                aria-expanded={openPanels.tools}
              >
                <span className="text-xs">{openPanels.tools ? "▾" : "▸"}</span> Tools
              </button>
              <Reveal open={openPanels.tools}>{toolsSection}</Reveal>
            </div>
          )}

        </div>
      </div>

      {/* Sticky Start bar: on a phone the primary control stays under the
          thumb no matter how far the page has scrolled. */}
      {armed && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-neutral-800 bg-neutral-950/95 px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          {sessionBtn("flex-1 py-3")}
          {swElapsed > 0 && !swRunning && (
            <>
              <button
                className="rounded-md bg-amber-500 px-4 py-3 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
                onClick={swLog}
              >
                Log it
              </button>
              <button className={btn} onClick={swReset}>
                Reset
              </button>
            </>
          )}
        </div>
      )}

      {/* Just the two numbers that matter today; lifetime totals live in Progress. */}
      {!loading && (
        <footer className="mt-8 text-center text-[10px] leading-relaxed text-neutral-600">
          {totalSecs > 0 && (
            <div>
              {streak > 1 && <span className="text-amber-400/80">streak {streak}</span>}
              {streak > 1 && todayTotal > 0 && " · "}
              {todayTotal > 0 && (
                <>
                  today <span className="tabular-nums">{Math.max(1, Math.round(todayTotal / 60))}m</span>
                </>
              )}
            </div>
          )}
          <div className="mt-1 text-neutral-700">
            suggestions →{" "}
            <a className="hover:text-neutral-400" href="mailto:benjamincrystal8@gmail.com">
              benjamincrystal8@gmail.com
            </a>
          </div>
        </footer>
      )}

      {/* First-visit walkthrough: three spotlights, or tap through the real
          controls — either advances it. */}
      {/* Step 0 of the walkthrough: the pitch, before any spotlights. Blocks
          the page (unlike the dim-only marks) so it reads as a front door. */}
      {coach === -1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/85 p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-700 bg-neutral-900 p-5 text-sm text-neutral-200 shadow-2xl">
            <h2 className="text-lg font-semibold">Welcome</h2>
            <p className="mt-2 text-neutral-300">
              The idea: about five short exercises a day, so you never have to decide what to practice. Arm one, hit
              Start, and it&apos;s logged in one tap.
            </p>
            <p className="mt-2 text-neutral-400">
              Tools show up only when an exercise needs them, with references along the way. The{" "}
              <a className="text-neutral-200 underline decoration-neutral-600 hover:decoration-neutral-300" href="/practice/tree">
                syllabus
              </a>{" "}
              has the whole path.
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              It&apos;s early days — all suggestions welcome:{" "}
              <a className="underline decoration-neutral-700 hover:text-neutral-300" href="mailto:benjamincrystal8@gmail.com">
                benjamincrystal8@gmail.com
              </a>
            </p>
            <div className="mt-4 flex items-center justify-between">
              <button className="text-xs text-neutral-500 hover:text-neutral-300" onClick={endCoach}>
                skip
              </button>
              <button
                className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-white"
                onClick={() => setCoach(0)}
              >
                show me around
              </button>
            </div>
          </div>
        </div>
      )}
      {coach !== null && coach >= 0 && (
        <CoachMark
          target={coach === 0 ? coachListRef : coachStartRef}
          text={
            [
              "Tap an exercise to arm it — the page rebuilds around what you're practicing.",
              "Start session runs the metronome and timer together.",
              "When you stop, Log it saves your tempo and time. That's the whole loop.",
            ][coach]
          }
          step={coach}
          total={3}
          nextLabel={coach === 2 ? "got it" : "next"}
          onNext={() => {
            if (coach === 2) return endCoach();
            if (coach === 0 && !armed && active[0]) {
              // "next" without tapping = arm the first one for them, which
              // also brings the (mobile-hidden) hero into view for step 2.
              armExercise(active[0], aggByDate(sessions ?? [], active[0].id));
            } else {
              setCoach(coach + 1);
            }
          }}
          onSkip={endCoach}
        />
      )}

      {/* Undo toast for one-tap logging (amber celebration on a personal best) */}
      {justLogged && (
        <div
          className={`fixed left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm shadow-lg ${armed ? "bottom-20 lg:bottom-4" : "bottom-4"} ${
            justLogged.pb ? "bg-amber-400 text-neutral-950" : "bg-neutral-800"
          }`}
        >
          <span>
            {justLogged.pb ? "✦ New best! " : "Logged "}
            {exById.get(justLogged.session.exercise_id)?.name}
            {justLogged.session.variant && ` ${justLogged.session.variant === "up" ? "↑" : "↓"}`}
            {justLogged.session.bpm != null && ` · ${justLogged.session.bpm} bpm`}
            {justLogged.session.seconds != null && ` · ${fmtDur(justLogged.session.seconds)}`}
          </span>
          <button
            className={`font-semibold ${justLogged.pb ? "text-neutral-950 underline" : "text-amber-400"}`}
            onClick={undoLog}
          >
            Undo
          </button>
        </div>
      )}

      {/* Desktop hover preview: large in-page peek, click-through (pointer-events-none) */}
      {hoverRef && !lightbox && (
        <div className="pointer-events-none fixed inset-0 z-40 hidden items-center justify-center bg-black/70 p-8 lg:flex">
          {isPdf(hoverRef) ? (
            <iframe
              src={hoverRef}
              title="reference preview"
              className="h-full w-full max-w-4xl rounded border border-neutral-700 bg-neutral-900"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hoverRef} className="max-h-full max-w-full rounded shadow-2xl" alt="reference preview" />
          )}
        </div>
      )}

      {/* Fullscreen image reference viewer */}
      {lightbox && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} className="max-h-full max-w-full rounded" alt="reference" />
        </div>
      )}

      {/* Hidden picker for reference uploads (triggered from Manage exercises) */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadRef(f);
          e.target.value = "";
        }}
      />
    </main>
  );
}
