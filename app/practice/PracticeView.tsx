"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BpmRuler from "./BpmRuler";
import Chart, { Series } from "./Chart";
import { Metronome } from "./metronome";

type Exercise = { id: string; name: string; position: number; archived: boolean };
type Session = {
  id: string;
  exercise_id: string;
  date: string; // yyyy-mm-dd
  bpm: number | null;
  seconds: number | null;
  note: string | null;
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

type FormState = {
  id?: string; // present when editing an existing entry
  exercise_id: string;
  date: string;
  bpm: string;
  dur: string;
  note: string;
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
  const taps = useRef<number[]>([]);

  // --- random note ---
  const [noteIdx, setNoteIdx] = useState<number | null>(null);
  const [noteLabel, setNoteLabel] = useState<string>("");

  // --- stopwatch ---
  const [selectedEx, setSelectedEx] = useState<string | null>(null);
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // ms
  const swStart = useRef(0);
  const swAccum = useRef(0);

  // --- log form / charts ---
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [metric, setMetric] = useState<"seconds" | "bpm">("seconds");
  const [manageOpen, setManageOpen] = useState(false);
  const [newExName, setNewExName] = useState("");

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
  }, []);

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

  const toggleMetronome = useCallback(() => {
    const m = getMetro();
    m.onBeat = (b) => setPulse(b);
    if (m.running) {
      m.stop();
      setRunning(false);
      setPulse(-1);
    } else {
      m.bpm = bpm;
      m.beatsPerBar = beatsPerBar;
      m.start();
      setRunning(true);
    }
  }, [bpm, beatsPerBar]);

  useEffect(() => {
    getMetro().bpm = bpm;
  }, [bpm]);
  useEffect(() => {
    getMetro().beatsPerBar = beatsPerBar;
  }, [beatsPerBar]);

  const nudgeBpm = (d: number) => setBpm((b) => Math.min(300, Math.max(20, b + d)));

  function tapTempo() {
    const now = performance.now();
    // A pause over 2s starts a fresh measurement.
    if (taps.current.length && now - taps.current[taps.current.length - 1] > 2000) taps.current = [];
    taps.current.push(now);
    taps.current = taps.current.slice(-6);
    if (taps.current.length >= 2) {
      const t = taps.current;
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1);
      setBpm(Math.min(300, Math.max(20, Math.round(60000 / avg))));
    }
  }

  // ---------- random note ----------

  const shuffleNote = useCallback(() => {
    setNoteIdx((prev) => {
      let idx = prev;
      while (idx === prev) idx = Math.floor(Math.random() * 12);
      const pair = NOTE_PAIRS[idx!];
      // 50/50 chance a black key is spelled as its flat name.
      setNoteLabel(pair.length === 2 && Math.random() < 0.5 ? pair[1] : pair[0]);
      return idx;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.metaKey || e.ctrlKey) return;
      if (e.key === "n" || e.key === "N") shuffleNote();
      if (e.key === " ") {
        e.preventDefault();
        toggleMetronome();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shuffleNote, toggleMetronome]);

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

  function swLog() {
    const total = swRunning ? swAccum.current + performance.now() - swStart.current : swAccum.current;
    swReset();
    setForm({
      exercise_id: selectedEx ?? exercises?.find((e) => !e.archived)?.id ?? "",
      date: todayISO(),
      bpm: String(bpm),
      dur: fmtSecs(total / 1000),
      note: "",
    });
  }

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
      const body = { exercise_id: form.exercise_id, date: form.date, bpm: bpmNum, seconds, note: form.note };
      if (form.id) {
        const { session } = await api("sessions", "PATCH", { id: form.id, ...body });
        setSessions((s) => s!.map((x) => (x.id === session.id ? session : x)));
      } else {
        const { session } = await api("sessions", "POST", body);
        setSessions((s) => [...(s ?? []), session]);
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

  // ---------- derived ----------

  const exById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const active = (exercises ?? []).filter((e) => !e.archived);

  // One point per exercise per day: total time, top BPM.
  const series: Series[] = active
    .map((ex) => {
      const byDate = new Map<string, { seconds: number; bpm: number }>();
      for (const s of sessions ?? []) {
        if (s.exercise_id !== ex.id) continue;
        const cur = byDate.get(s.date) ?? { seconds: 0, bpm: 0 };
        cur.seconds += s.seconds ?? 0;
        cur.bpm = Math.max(cur.bpm, s.bpm ?? 0);
        byDate.set(s.date, cur);
      }
      const points = Array.from(byDate.entries())
        .map(([date, v]) => ({ x: new Date(date + "T00:00:00").getTime(), y: v[metric] }))
        .filter((p) => p.y > 0)
        .sort((a, b) => a.x - b.x);
      return { name: ex.name, color: exColor(ex.id), points };
    })
    .filter((s) => s.points.length > 0);

  const byDateDesc = [...(sessions ?? [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)
  );
  const dates = Array.from(new Set(byDateDesc.map((s) => s.date)));

  const loading = exercises === null || sessions === null;

  // ---------- render ----------

  const card = "rounded-xl border border-neutral-800 bg-neutral-900 p-4";
  const btn = "rounded-md bg-neutral-800 px-3 py-2 text-sm hover:bg-neutral-700 active:bg-neutral-600";
  const input =
    "rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-sm placeholder:text-neutral-600";

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-neutral-950 px-4 py-6 text-neutral-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Guitar Practice</h1>
        {unlocked ? (
          <span className="text-xs text-neutral-500">editing on</span>
        ) : (
          <button className="text-xs text-neutral-400 underline" onClick={() => setUnlockOpen(true)}>
            unlock editing
          </button>
        )}
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

      {/* ---- Metronome ---- */}
      <section className={`${card} mb-4`}>
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
          <button
            className={`rounded-md px-5 py-2 text-sm font-semibold ${
              running ? "bg-amber-500 text-neutral-950 hover:bg-amber-400" : "bg-neutral-100 text-neutral-950 hover:bg-white"
            }`}
            onClick={toggleMetronome}
          >
            {running ? "Stop" : "Start"}
          </button>
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
      </section>

      {/* ---- Random note ---- */}
      <section className={`${card} mb-4 flex items-center justify-between`}>
        <div>
          <h2 className="text-sm font-medium text-neutral-400">Random note</h2>
          <p className="text-xs text-neutral-600">press N or tap the note</p>
        </div>
        <button
          onClick={shuffleNote}
          className="min-w-[5.5rem] rounded-lg bg-neutral-800 px-4 py-3 text-center text-3xl font-bold hover:bg-neutral-700"
        >
          {noteLabel || "?"}
        </button>
      </section>

      {/* ---- Stopwatch ---- */}
      <section className={`${card} mb-4`}>
        <h2 className="mb-2 text-sm font-medium text-neutral-400">Stopwatch</h2>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {active.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedEx(ex.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedEx === ex.id
                  ? "border-transparent text-neutral-950"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
              style={selectedEx === ex.id ? { background: exColor(ex.id) } : undefined}
            >
              {ex.name}
            </button>
          ))}
          {!loading && active.length === 0 && (
            <p className="text-sm text-neutral-500">No exercises yet — add one below.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-auto text-3xl font-bold tabular-nums">{fmtSecs(swElapsed / 1000)}</div>
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

      {/* ---- Entry form ---- */}
      {form && (
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
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={input}
            />
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
      )}

      {/* ---- Charts ---- */}
      <section className={`${card} mb-4`}>
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
            <Chart series={series} fmtY={metric === "seconds" ? fmtSecs : (y) => String(Math.round(y))} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {series.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className="h-2 w-4 rounded-sm" style={{ background: s.color }} />
                  {s.name}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ---- Log ---- */}
      <section className={`${card} mb-4`}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-400">Log</h2>
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
        {!loading && byDateDesc.length === 0 && (
          <p className="py-4 text-center text-sm text-neutral-500">Nothing logged yet.</p>
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
                  <span className="min-w-0 flex-1 truncate">{exById.get(s.exercise_id)?.name ?? "?"}</span>
                  {s.note && <span className="hidden max-w-[10rem] truncate text-xs text-neutral-500 sm:inline">{s.note}</span>}
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

      {/* ---- Exercises ---- */}
      <section className={card}>
        <button
          className="flex w-full items-center justify-between text-sm font-medium text-neutral-400"
          onClick={() => setManageOpen((o) => !o)}
        >
          Exercises
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
                      onClick={() => patchExercise(ex.id, { archived: !ex.archived })}
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
    </main>
  );
}
