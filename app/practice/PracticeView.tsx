"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BpmRuler from "./BpmRuler";
import Chart, { Series } from "./Chart";
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
};
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

// "96 bpm · 4:10" — whichever parts an aggregate actually has.
function fmtAgg(a: DayAgg) {
  return [a.bpm > 0 ? `${a.bpm} bpm` : "", a.seconds > 0 ? fmtSecs(a.seconds) : ""].filter(Boolean).join(" · ");
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

  // --- log form / cards / charts ---
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedEx, setExpandedEx] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState<{ session: Session; pb: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [metric, setMetric] = useState<"seconds" | "bpm">("seconds");
  const [focusEx, setFocusEx] = useState<string | null>(null); // chart legend isolation
  const [manageOpen, setManageOpen] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [hoverRef, setHoverRef] = useState<string | null>(null); // desktop hover preview
  const dragEx = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const attachTarget = useRef<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [descEdit, setDescEdit] = useState<{ id: string; text: string } | null>(null);

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
    const first = (ex.exercises as Exercise[]).find((e) => !e.archived);
    setSelectedEx((cur) => (cur && ex.exercises.some((e: Exercise) => e.id === cur) ? cur : first?.id ?? null));
  }

  useEffect(() => {
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
    } catch {
      // Corrupt prefs — defaults are fine.
    }
    return () => window.removeEventListener("online", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ bpm, beatsPerBar, sound, volume, noteSync, countIn, trainer, trainerAdd, trainerBars })
    );
  }, [bpm, beatsPerBar, sound, volume, noteSync, countIn, trainer, trainerAdd, trainerBars]);

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

  // Advance to the (pre-generated) next note and queue a fresh one, so the
  // upcoming note can always be previewed.
  const advanceNote = useCallback(() => {
    const cur = noteRef.current.next ?? randNote(noteRef.current.cur?.idx ?? null);
    const next = randNote(cur.idx);
    noteRef.current = { cur, next };
    setNoteCur(cur);
    setNoteNext(next);
    setNoteMorph(null);
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
      if (every > 0 && barCount.current >= 0) {
        // Count beats from the bar structure (not a free-running counter) so
        // note changes stay anchored to the downbeat even if the interval is
        // switched on mid-run.
        const beatIndex = barCount.current * m.beatsPerBar + b;
        if (beatIndex % every === 0) advanceNote();
        // Up to 4 beats before the swap, start easing the upcoming note in.
        const lead = Math.min(4, every);
        if ((beatIndex + lead) % every === 0) setNoteMorph((lead * 60000) / m.bpm);
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
    if (swRunning || countingIn) {
      // Stop everything (a stop during the count-in just cancels it).
      countInPending.current = false;
      setCountingIn(false);
      if (swRunning) swToggle();
      if (m.running) toggleMetronome();
    } else if (countIn && !m.running) {
      // One bar of clicks first; the beat handler starts the timer.
      countInPending.current = true;
      setCountingIn(true);
      toggleMetronome();
    } else {
      swToggle();
      if (!m.running) toggleMetronome();
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
      const { exercise } = await api("exercises", "POST", { name });
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
  // down-stroke starts, dashed for up. exName groups them for the legend.
  type VSeries = Series & { exName: string };
  const series: VSeries[] = active
    .flatMap((ex) => {
      const mk = (v: Variant | undefined, suffix: string, dash: boolean): VSeries => ({
        name: ex.name + suffix,
        exName: ex.name,
        color: colorOf(ex.id),
        dash,
        points: aggByDate(sessions ?? [], ex.id, v)
          .map((a) => ({ x: new Date(a.date + "T00:00:00").getTime(), y: a[metric] }))
          .filter((p) => p.y > 0)
          .reverse(),
      });
      return ex.track_variants
        ? [mk("down", " ↓", false), mk("up", " ↑", true)]
        : [mk(undefined, "", false)];
    })
    .filter((s) => s.points.length > 0);

  // One legend entry per exercise, even when it draws two variant lines.
  const legendItems = Array.from(new Map(series.map((s) => [s.exName, s.color])).entries());

  // Legend isolation: dim every line except the focused exercise's.
  const displaySeries: Series[] = focusEx
    ? series.map((s) => (s.exName === focusEx ? s : { ...s, color: s.color + "26" }))
    : series;

  const byDateDesc = [...(sessions ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );
  const dates = Array.from(new Set(byDateDesc.map((s) => s.date)));

  const todayTotal = (sessions ?? [])
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + (s.seconds ?? 0), 0);

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

  // Heatmap: ~26 weeks of daily totals (GitHub-style), shown once charts
  // unlock. Amber intensity scales with minutes relative to the best day.
  const secsByDate = new Map<string, number>();
  for (const s of sessions ?? []) secsByDate.set(s.date, (secsByDate.get(s.date) ?? 0) + (s.seconds ?? 0));
  const heatMax = Math.max(1, ...Array.from(secsByDate.values()));
  const heatWeeks: { iso: string; secs: number; future: boolean }[][] = [];
  {
    const start = new Date();
    start.setDate(start.getDate() - start.getDay() - 25 * 7); // back to a Sunday, 26 weeks ago
    for (let w = 0; w < 26; w++) {
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
      <div className="sticky top-0 z-20 -mx-4 flex items-center gap-2 border-b border-neutral-800 bg-neutral-950/95 px-4 py-2 backdrop-blur lg:hidden">
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

      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Guitar Practice</h1>
        <div className="flex items-center gap-3">
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
        <div className="mb-4 rounded-md border border-amber-900 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
          Offline — edits are saved on this device and sync when you're back.
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ---- Tools column ---- */}
        <div className="lg:sticky lg:top-4">
          {/* Session hero: armed exercise + tempo + one primary control.
              Always on desktop, expanded-only on mobile (the strip drives it). */}
          <section className={`${card} mb-4 border-amber-500/25 ${metroOpen ? "" : "hidden lg:block"}`}>
            <div className="mb-3">
              <div className="break-words font-medium">
                {selectedEx ? exById.get(selectedEx)?.name : <span className="text-neutral-500">no exercise armed</span>}
              </div>
              <div className="text-xs text-neutral-500">
                {bpm} bpm · {beatsPerBar}/4 · {sound}
                {selTodaySecs > 0 && (
                  <>
                    {" · "}
                    <span className="tabular-nums text-neutral-300">{fmtSecs(selTodaySecs)}</span> today
                  </>
                )}
              </div>
              {selectedEx && exById.get(selectedEx)?.track_variants && (
                <div className="mt-1.5 flex gap-1">
                  {(["down", "up"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => selectVariant(v)}
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
            <div className="flex items-end justify-between">
              <div>
                <div className={`font-bold tabular-nums transition-all ${swRunning ? "text-2xl" : "text-4xl"}`}>
                  {bpm}
                  <span className="ml-1 text-sm font-normal text-neutral-500">bpm</span>
                </div>
                {/* Beat dots live right under the number they describe; the
                    downbeat is amber even at rest so "1" reads at a glance. */}
                <div className="mt-1.5 flex items-center gap-2">
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
              </div>
              <div className="pb-0.5 text-right">
                <div
                  className={`font-bold tabular-nums transition-all ${
                    swRunning ? "text-5xl text-amber-400" : swElapsed > 0 ? "text-3xl" : "text-3xl text-neutral-600"
                  }`}
                >
                  {fmtSecs(swElapsed / 1000)}
                </div>
                <div className={`text-[10px] ${countingIn ? "text-amber-400" : "text-neutral-600"}`}>
                  {countingIn ? "count-in…" : "session"}
                </div>
              </div>
            </div>
            <BpmRuler value={bpm} onChange={setBpm} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button className={btn} onClick={tapTempo}>
                Tap
              </button>
              <div className="flex gap-1">
                {[-5, -1, +1, +5].map((d) => (
                  <button key={d} className={btn} onClick={() => nudgeBpm(d)}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
              <select
                value={beatsPerBar}
                onChange={(e) => setBeatsPerBar(Number(e.target.value))}
                className={`${input} ml-auto`}
                aria-label="beats per bar"
              >
                {[2, 3, 4, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}/4
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex items-center gap-2">
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
            {/* A mode, not a setting — its own row, quieter than Start. */}
            <div className="mt-2">
              <button
                className={`w-full rounded-md border px-3 py-1.5 text-xs ${
                  running
                    ? "border-amber-500/50 text-amber-400 hover:bg-neutral-800"
                    : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                }`}
                onClick={toggleMetronome}
              >
                {running ? "stop metronome" : "metronome only"}
              </button>
            </div>
            {/* Session extras: opt-in behaviors for the Start button. */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400">
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
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex overflow-hidden rounded-md border border-neutral-700 text-xs">
                {(["beep", "wood", "tick"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSound(s)}
                    className={`px-2.5 py-1.5 ${sound === s ? "bg-neutral-200 text-neutral-950" : "text-neutral-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
              <label className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500 lg:hidden">
                note every
                <select
                  value={noteSync}
                  onChange={(e) => setNoteSync(Number(e.target.value))}
                  className={input}
                  aria-label="auto note change"
                >
                  <option value={0}>off</option>
                  {[1, 2, 4, 8, 16, 32].map((n) => (
                    <option key={n} value={n}>
                      {n} beat{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Random note: its own card on desktop; lives in the strip on mobile. */}
          <section className={`${card} mb-4 hidden items-center justify-between gap-3 lg:flex`}>
            <div>
              <h2 className="text-sm font-medium text-neutral-400">Random note</h2>
              <p className="text-xs text-neutral-600">press N or tap the note</p>
              <label className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                change every
                <select
                  value={noteSync}
                  onChange={(e) => setNoteSync(Number(e.target.value))}
                  className={input}
                  aria-label="auto note change"
                >
                  <option value={0}>off</option>
                  {[1, 2, 4, 8, 16, 32].map((n) => (
                    <option key={n} value={n}>
                      {n} beat{n > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              onClick={advanceNote}
              className="min-w-[5.5rem] rounded-lg bg-neutral-800 px-4 py-3 text-center hover:bg-neutral-700"
            >
              {noteCur ? (
                <NoteMorph
                  cur={noteCur.label}
                  next={noteSync > 0 ? noteNext?.label ?? null : null}
                  morphMs={noteMorph}
                  curClass="inline-block text-3xl font-bold"
                  nextClass="ml-2 inline-block align-middle text-sm text-neutral-500"
                />
              ) : (
                <span className="text-3xl font-bold">?</span>
              )}
            </button>
          </section>

          {/* Handy external references (and the future home of a drone/tuner). */}
          <section className={`${card} mb-4 hidden lg:block`}>
            <h2 className="mb-1 text-sm font-medium text-neutral-400">Tools</h2>
            <div className="flex flex-col gap-1 text-xs">
              <a
                className="text-neutral-500 underline hover:text-neutral-300"
                href="https://www.oolimo.com/en/guitar-chords/analyze"
                target="_blank"
                rel="noopener noreferrer"
              >
                chord analyzer (oolimo) ↗
              </a>
              <a
                className="text-neutral-500 underline hover:text-neutral-300"
                href="https://www.all-guitar-chords.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                chords &amp; scales reference (all-guitar-chords) ↗
              </a>
            </div>
          </section>
        </div>

        {/* ---- Content column ---- */}
        <div>
          {/* Exercise cards: last vs today at a glance; tap = arm stopwatch + metronome. */}
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-400">Exercises</h2>
            <button
              className="text-xs text-neutral-500 underline hover:text-neutral-300"
              onClick={() => setManageOpen((o) => !o)}
            >
              {manageOpen ? "close manage" : "manage"}
            </button>
          </div>
          <section className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Said once, up here — the cards below just show a quiet "—". */}
            {!loading && (sessions ?? []).length === 0 && active.length > 0 && (
              <p className="text-xs text-neutral-600 sm:col-span-2">
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
                  className={`cursor-pointer rounded-xl border bg-neutral-900 p-3 transition-colors ${
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
                  <button className="flex w-full items-center gap-2 text-left" onClick={() => armExercise(ex, aggs)}>
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
                        className="px-1 text-xs text-neutral-500 hover:text-neutral-200"
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
                    <span
                      role="button"
                      tabIndex={0}
                      title="History & full description"
                      className="px-1 text-xs text-neutral-500 hover:text-neutral-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedEx(expanded ? null : ex.id);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && setExpandedEx(expanded ? null : ex.id)}
                    >
                      {expanded ? "▾" : "▸"}
                    </span>
                  </button>
                  {ex.description && !expanded && (
                    // Two-line teaser; the chevron's detail view has the rest.
                    <p className="mt-0.5 line-clamp-2 whitespace-pre-line pl-[1.125rem] text-xs text-neutral-500">
                      {ex.description}
                    </p>
                  )}
                  {aggs.length === 0 ? null : ex.track_variants ? (
                    // One row per stroke-start so both tempos are visible at a glance.
                    <div className="mt-2 space-y-0.5 text-sm">
                      {(["down", "up"] as const).map((v) => {
                        const vAggs = aggByDate(sessions ?? [], ex.id, v);
                        const vToday = vAggs[0]?.date === today ? vAggs[0] : null;
                        const vLast = vToday ? vAggs[1] : vAggs[0];
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
                            {lastAgg.seconds > 0 && fmtSecs(lastAgg.seconds)}
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
                            {todayAgg.seconds > 0 && fmtSecs(todayAgg.seconds)}
                          </span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(timeDelta !== null || bpmDelta !== null) && (
                    <div className="mt-1 flex gap-3 text-xs">
                      {bpmDelta !== null && bpmDelta !== 0 && (
                        <span className={bpmDelta > 0 ? "text-green-400" : "text-red-400"}>
                          {bpmDelta > 0 ? "▲" : "▼"} {Math.abs(bpmDelta)} bpm
                        </span>
                      )}
                      {timeDelta !== null && Math.abs(timeDelta) >= 0.005 && (
                        <span className={timeDelta < 0 ? "text-green-400" : "text-red-400"}>
                          {timeDelta < 0 ? "▼" : "▲"} {Math.abs(Math.round(timeDelta * 100))}% time
                        </span>
                      )}
                    </div>
                  )}
                  {expanded && (
                    <div className="mt-2 border-t border-neutral-800 pt-2 text-xs text-neutral-400">
                      {ex.description && (
                        <div className="mb-2">
                          <DescriptionBody text={ex.description} />
                        </div>
                      )}
                      {aggs.slice(0, 7).map((a) => (
                        <div key={a.date} className="flex justify-between py-0.5 tabular-nums">
                          <span>{fmtDateShort(a.date)}</span>
                          <span>{a.bpm > 0 ? `${a.bpm} bpm` : ""}</span>
                          <span>{a.seconds > 0 ? fmtSecs(a.seconds) : ""}</span>
                        </div>
                      ))}
                      {aggs.length === 0 && <p className="py-1 text-neutral-600">no sessions yet</p>}
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && active.length === 0 && (
              <p className={`${card} text-sm text-neutral-500 sm:col-span-2`}>
                No exercises yet — open “manage” above to add one.
              </p>
            )}
          </section>

          {entryForm}

          {/* Progress: a real chart once ~5 days exist; before that a week
              strip + streak, which says more than a scatter of single dots. */}
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
                <Chart series={displaySeries} fmtY={metric === "seconds" ? fmtSecs : (y) => String(Math.round(y))} />
                {/* Legend doubles as a filter: tap a name to isolate its line(s). */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {legendItems.map(([name, color]) => (
                    <button
                      key={name}
                      onClick={() => setFocusEx(focusEx === name ? null : name)}
                      className={`flex items-center gap-1.5 text-xs ${
                        focusEx && focusEx !== name ? "text-neutral-600" : "text-neutral-400"
                      }`}
                    >
                      <span
                        className="h-2 w-4 rounded-sm"
                        style={{ background: focusEx && focusEx !== name ? color + "40" : color }}
                      />
                      {name}
                    </button>
                  ))}
                </div>
                {/* Daily heatmap: half a year of totals at a glance. */}
                <div className="mt-4 overflow-x-auto">
                  <div className="flex gap-[3px]">
                    {heatWeeks.map((week, i) => (
                      <div key={i} className="flex flex-col gap-[3px]">
                        {week.map((d) => (
                          <span
                            key={d.iso}
                            title={`${fmtDateShort(d.iso)}${d.secs > 0 ? ` · ${fmtSecs(d.secs)}` : ""}`}
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
                </div>
              </>
            )}
          </section>

          {/* Log */}
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
            {dates.map((date) => (
              <div key={date} className="mb-3">
                <h3 className="mb-1 text-xs font-semibold text-neutral-500">
                  {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                {byDateDesc
                  .filter((s) => s.date === date)
                  .map((s) => (
                    <div key={s.id} className="flex items-baseline gap-2 border-b border-neutral-800/60 py-1.5 text-sm">
                      <span
                        className="h-2 w-2 shrink-0 self-center rounded-full"
                        style={{ background: colorOf(s.exercise_id) }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {exById.get(s.exercise_id)?.name ?? "?"}
                        {s.variant && (
                          <span className="ml-1 text-xs text-neutral-500">{s.variant === "up" ? "↑" : "↓"}</span>
                        )}
                      </span>
                      {s.note && (
                        <span className="max-w-[8rem] truncate text-xs text-neutral-500 sm:max-w-[10rem]">{s.note}</span>
                      )}
                      <span className="tabular-nums text-neutral-400">{s.bpm != null ? `${s.bpm} bpm` : ""}</span>
                      <span className="w-14 text-right tabular-nums">{s.seconds != null ? fmtSecs(s.seconds) : ""}</span>
                      {unlocked && (
                        <span className="flex gap-1.5 text-xs">
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
                          <button className="text-neutral-500 hover:text-red-400" onClick={() => deleteSession(s.id)}>
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            ))}
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
              </div>
          </section>
          )}
        </div>
      </div>

      {/* Tiny lifetime stats, tucked at the bottom so they never crowd the tools.
          Mobile also gets streak/week/all-time here since the header hides them. */}
      {!loading && totalSecs > 0 && (
        <footer className="mt-8 text-center text-[10px] leading-relaxed text-neutral-600">
          {streak > 1 && <span className="text-amber-400/80">streak {streak} · </span>}
          {todayTotal > 0 && (
            <>
              today <span className="tabular-nums">{fmtSecs(todayTotal)}</span> ·{" "}
            </>
          )}
          this week <span className="tabular-nums">{fmtSecs(weekSecs)}</span> · all-time{" "}
          <span className="tabular-nums">{fmtSecs(totalSecs)}</span> · days practiced {daysPracticed} · best streak{" "}
          {bestStreak} · avg <span className="tabular-nums">{fmtSecs(totalSecs / daysPracticed)}</span>/day
        </footer>
      )}

      {/* The Tools card is desktop-only; mobile gets the links down here. */}
      <div className="mt-2 text-center text-[10px] text-neutral-600 lg:hidden">
        <a
          className="underline hover:text-neutral-400"
          href="https://www.oolimo.com/en/guitar-chords/analyze"
          target="_blank"
          rel="noopener noreferrer"
        >
          chord analyzer ↗
        </a>
        {" · "}
        <a
          className="underline hover:text-neutral-400"
          href="https://www.all-guitar-chords.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          chords &amp; scales ↗
        </a>
      </div>

      {/* Undo toast for one-tap logging (amber celebration on a personal best) */}
      {justLogged && (
        <div
          className={`fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm shadow-lg ${
            justLogged.pb ? "bg-amber-400 text-neutral-950" : "bg-neutral-800"
          }`}
        >
          <span>
            {justLogged.pb ? "✦ New best! " : "Logged "}
            {exById.get(justLogged.session.exercise_id)?.name}
            {justLogged.session.variant && ` ${justLogged.session.variant === "up" ? "↑" : "↓"}`}
            {justLogged.session.bpm != null && ` · ${justLogged.session.bpm} bpm`}
            {justLogged.session.seconds != null && ` · ${fmtSecs(justLogged.session.seconds)}`}
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
