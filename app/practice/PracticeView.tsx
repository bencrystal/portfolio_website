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

// Same stable-color trick as /list: hash the id into a palette slot.
const PALETTE = ["#3b82f6", "#ef4444", "#eab308", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#ec4899"];
function exColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
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

  // --- stopwatch ---
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const [variant, setVariant] = useState<Variant>("down"); // stroke-start for tracked exercises
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // ms
  const swStart = useRef(0);
  const swAccum = useRef(0);

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

  function getMetro() {
    metro.current ??= new Metronome();
    return metro.current;
  }

  // ---------- data ----------

  useEffect(() => {
    Promise.all([
      fetch("/api/practice/exercises").then((r) => r.json()),
      fetch("/api/practice/sessions").then((r) => r.json()),
    ])
      .then(([ex, se]) => {
        if (ex.error || se.error) throw new Error(ex.error ?? se.error);
        setExercises(ex.exercises);
        setSessions(se.sessions);
        const first = (ex.exercises as Exercise[]).find((e) => !e.archived);
        setSelectedEx((cur) => cur ?? first?.id ?? null);
      })
      .catch((e) => setError(String(e.message ?? e)));
    // Re-verify a remembered password silently.
    if (localStorage.getItem(TOKEN_KEY)) void verifyToken(localStorage.getItem(TOKEN_KEY)!).then(setUnlocked);
    // Restore metronome prefs.
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      if (typeof p.bpm === "number") setBpm(clampBpm(p.bpm));
      if (typeof p.beatsPerBar === "number") setBeatsPerBar(p.beatsPerBar);
      if (["beep", "wood", "tick"].includes(p.sound)) setSound(p.sound);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
      if (typeof p.noteSync === "number") setNoteSync(p.noteSync);
    } catch {
      // Corrupt prefs — defaults are fine.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ bpm, beatsPerBar, sound, volume, noteSync }));
  }, [bpm, beatsPerBar, sound, volume, noteSync]);

  // The sessions PATCH route checks the token before reading the body, so an
  // empty body distinguishes "authorized but bad request" (400) from 401.
  async function verifyToken(token: string): Promise<boolean> {
    const res = await fetch(`/api/practice/sessions?token=${encodeURIComponent(token)}`, {
      method: "PATCH",
      body: "{}",
    });
    return res.status !== 401;
  }

  async function api(path: "exercises" | "sessions", method: string, body: unknown) {
    const token = localStorage.getItem(TOKEN_KEY) ?? "";
    const res = await fetch(`/api/practice/${path}?token=${encodeURIComponent(token)}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
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

  async function submitPassword() {
    const pw = pwInput.trim();
    if (!pw) return;
    if (await verifyToken(pw)) {
      localStorage.setItem(TOKEN_KEY, pw);
      setUnlocked(true);
      setUnlockOpen(false);
      setPwInput("");
      setPwError(false);
    } else {
      setPwError(true);
    }
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
  }, []);

  const toggleMetronome = useCallback(() => {
    const m = getMetro();
    m.onBeat = (b) => {
      setPulse(b);
      if (b === 0) barCount.current++;
      const every = noteSyncRef.current;
      if (every > 0 && barCount.current >= 0) {
        // Count beats from the bar structure (not a free-running counter) so
        // note changes stay anchored to the downbeat even if the interval is
        // switched on mid-run.
        const beatIndex = barCount.current * m.beatsPerBar + b;
        if (beatIndex % every === 0) advanceNote();
      }
    };
    if (m.running) {
      m.stop();
      setRunning(false);
      setPulse(-1);
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

  function openRef(url: string) {
    if (isPdf(url)) window.open(url, "_blank", "noopener");
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

  // Variant-tracked exercises get two lines in the same color: solid for
  // down-stroke starts, dashed for up. exName groups them for the legend.
  type VSeries = Series & { exName: string };
  const series: VSeries[] = active
    .flatMap((ex) => {
      const mk = (v: Variant | undefined, suffix: string, dash: boolean): VSeries => ({
        name: ex.name + suffix,
        exName: ex.name,
        color: exColor(ex.id),
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

  const loading = exercises === null || sessions === null;

  // ---------- render ----------

  const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-4";
  const btn = "rounded-md bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 active:bg-neutral-600";
  const input =
    "rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm placeholder:text-neutral-600";

  const startBtn = (extra = "") => (
    <button
      className={`rounded-md px-4 py-2 text-sm font-semibold ${
        running ? "bg-amber-500 text-neutral-950 hover:bg-amber-400" : "bg-neutral-100 text-neutral-950 hover:bg-white"
      } ${extra}`}
      onClick={toggleMetronome}
    >
      {running ? "Stop" : "Start"}
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
        {startBtn()}
        <button
          onClick={advanceNote}
          className="ml-auto flex min-w-[3.25rem] items-baseline justify-center gap-1.5 rounded-md bg-neutral-800 px-2 py-1.5 text-center text-xl font-bold hover:bg-neutral-700"
          aria-label="random note"
        >
          {noteCur?.label ?? "♪?"}
          {noteNext && noteSync > 0 && <span className="text-xs font-normal text-neutral-500">{noteNext.label}</span>}
        </button>
      </div>

      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl font-semibold">Guitar Practice</h1>
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <span className="text-xs text-amber-400/90">{streak}-day streak</span>
          )}
          {weekSecs > 0 && (
            <span className="hidden text-xs text-neutral-500 sm:inline">
              <span className="tabular-nums text-neutral-300">{fmtSecs(weekSecs)}</span> this week
            </span>
          )}
          {todayTotal > 0 && (
            <span className="text-xs text-neutral-500">
              today <span className="tabular-nums text-neutral-300">{fmtSecs(todayTotal)}</span>
            </span>
          )}
          {unlocked ? (
            <span className="text-xs text-neutral-500">editing on</span>
          ) : (
            <button className="text-xs text-neutral-400 underline" onClick={() => setUnlockOpen(true)}>
              unlock editing
            </button>
          )}
        </div>
      </div>

      {unlockOpen && !unlocked && (
        <div className={`${card} mb-4`}>
          <p className="mb-2 text-sm text-neutral-400">Enter the edit password (saved on this device).</p>
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
              Unlock
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

      <div className="lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-6">
        {/* ---- Tools column ---- */}
        <div className="lg:sticky lg:top-4">
          {/* Full metronome card: always on desktop, expanded-only on mobile. */}
          <section className={`${card} mb-4 ${metroOpen ? "" : "hidden lg:block"}`}>
            <div className="mb-1 flex items-end justify-between">
              <div className="text-4xl font-bold tabular-nums">
                {bpm}
                <span className="ml-1 text-sm font-normal text-neutral-500">bpm</span>
              </div>
              <div className="flex items-center gap-1.5 pb-2">
                {Array.from({ length: beatsPerBar }, (_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      running && pulse === i ? (i === 0 ? "bg-amber-400" : "bg-neutral-200") : "bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <BpmRuler value={bpm} onChange={setBpm} />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {startBtn("hidden lg:block")}
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
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => setVolume(Number(e.target.value) / 100)}
                className="w-24 accent-amber-500"
                aria-label="volume"
              />
              <label className="ml-auto flex items-center gap-1.5 text-xs text-neutral-500 lg:hidden">
                note every
                <select
                  value={noteSync}
                  onChange={(e) => setNoteSync(Number(e.target.value))}
                  className={input}
                  aria-label="auto note change"
                >
                  <option value={0}>off</option>
                  {[1, 2, 4, 8].map((n) => (
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
                  {[1, 2, 4, 8].map((n) => (
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
              <span className="text-3xl font-bold">{noteCur?.label ?? "?"}</span>
              {noteNext && noteSync > 0 && (
                <span className="ml-2 align-middle text-sm text-neutral-500">then {noteNext.label}</span>
              )}
            </button>
          </section>

          {/* Stopwatch */}
          <section className={`${card} mb-4`}>
            <div className="flex items-center gap-2">
              <div className="mr-auto">
                <div className="text-3xl font-bold tabular-nums">{fmtSecs(swElapsed / 1000)}</div>
                <div className="max-w-[10rem] truncate text-xs text-neutral-500">
                  {selectedEx ? exById.get(selectedEx)?.name : "no exercise selected"}
                </div>
                {selectedEx && exById.get(selectedEx)?.track_variants && (
                  <div className="mt-1 flex gap-1">
                    {(["down", "up"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => selectVariant(v)}
                        className={`rounded px-1.5 py-0.5 text-xs ${
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
              <button className={btn} onClick={swToggle}>
                {swRunning ? "Pause" : swElapsed > 0 ? "Resume" : "Start"}
              </button>
              {swElapsed > 0 && (
                <>
                  <button className={btn} onClick={swReset}>
                    Reset
                  </button>
                  <button
                    className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white"
                    onClick={swLog}
                  >
                    Log it
                  </button>
                </>
              )}
            </div>
          </section>
        </div>

        {/* ---- Content column ---- */}
        <div>
          {/* Exercise cards: last vs today at a glance; tap = arm stopwatch + metronome. */}
          <section className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  className={`rounded-xl border bg-neutral-900 p-3 transition-colors ${
                    selected ? "" : "border-neutral-800 hover:border-neutral-700"
                  }`}
                  style={selected ? { borderColor: exColor(ex.id) } : undefined}
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
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: exColor(ex.id) }} />
                    <span className="min-w-0 flex-1 break-words font-medium">{ex.name}</span>
                    {ex.ref_url && (
                      <span
                        role="button"
                        tabIndex={0}
                        title="View reference"
                        className="px-1 text-xs text-neutral-500 hover:text-neutral-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHoverRef(null);
                          openRef(ex.ref_url!);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && openRef(ex.ref_url!)}
                        onMouseEnter={() => setHoverRef(ex.ref_url!)}
                        onMouseLeave={() => setHoverRef(null)}
                      >
                        ♪
                      </span>
                    )}
                    <span
                      role="button"
                      tabIndex={0}
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
                  {ex.description && (
                    <p className="mt-0.5 pl-[1.125rem] text-xs text-neutral-500">{ex.description}</p>
                  )}
                  {aggs.length === 0 ? (
                    <p className="mt-2 text-xs text-neutral-600">not practiced yet — tap to arm the stopwatch</p>
                  ) : ex.track_variants ? (
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
              <p className={`${card} text-sm text-neutral-500 sm:col-span-2`}>No exercises yet — add one below.</p>
            )}
          </section>

          {entryForm}

          {/* Charts (hidden until there's something to plot) */}
          <section className={`${card} mb-4 ${!loading && series.length === 0 ? "hidden" : ""}`}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-400">Progress</h2>
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
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>
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
                        style={{ background: exColor(s.exercise_id) }}
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

          {/* Exercises */}
          <section className={card}>
            <button
              className="flex w-full items-center justify-between text-sm font-medium text-neutral-400"
              onClick={() => setManageOpen((o) => !o)}
            >
              Manage exercises
              <span className="text-xs">{manageOpen ? "▾" : "▸"}</span>
            </button>
            {manageOpen && (
              <div className="mt-3">
                {(exercises ?? []).map((ex) => (
                  <div key={ex.id} className="flex items-center gap-2 border-b border-neutral-800/60 py-1.5 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ background: exColor(ex.id) }} />
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
                          className="text-xs text-neutral-500 hover:text-neutral-200"
                          onClick={() => {
                            const description = prompt("Description (empty clears)", ex.description ?? "");
                            if (description !== null) void patchExercise(ex.id, { description });
                          }}
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
            )}
          </section>
        </div>
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
