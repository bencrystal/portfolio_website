"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Tuner from "./Tuner";
import { ClickSound, Metronome } from "./metronome";

// Tools-only landing for /practice: metronome, random key + drone, tuner,
// compact backing-track player, timer, and curated external resources — no
// accounts, no logging. The full log lives at /practice/log.

// Shared with PracticeView so BPM/sound/volume prefs carry across both pages;
// read-merge-write so log-only prefs (instFilter, extrasOpen, …) survive.
const PREFS_KEY = "practice_prefs";
const FAVS_KEY = "practice_yt_favs";

const clampBpm = (b: number) => Math.min(300, Math.max(20, Math.round(b)));

// 12 chromatic pitches; the black keys carry both spellings.
const NOTE_PAIRS: string[][] = [
  ["A"], ["A#", "Bb"], ["B"], ["C"], ["C#", "Db"], ["D"],
  ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"],
];
type Note = { idx: number; label: string };
function randNote(excludeIdx: number | null): Note {
  let idx = excludeIdx;
  while (idx === excludeIdx) idx = Math.floor(Math.random() * 12);
  const pair = NOTE_PAIRS[idx!];
  return { idx: idx!, label: pair.length === 2 && Math.random() < 0.5 ? pair[1] : pair[0] };
}

// YouTube watch/share/shorts/embed links all yield the 11-char video id.
function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

type Fav = { id: string; title: string };
type SearchResult = { id: string; title: string; channel: string; thumb: string | null };

// Curated outside material — knowledge and theory worth pointing friends at.
const RESOURCES: { label: string; note: string; url: string }[] = [
  {
    label: "Jens Larsen — everything for jazz guitar, in order",
    note: "the ladder the practice plan follows",
    url: "https://youtu.be/EMQydbilqmo",
  },
  {
    label: "Larsen's exercise tabs (PDF)",
    note: "tabs for the scale/arpeggio passes",
    url: "https://mcusercontent.com/29585eaee49c1a06333528599/files/90a9c408-7fe0-6ba1-7847-4e0361d119e6/Everything_You_Need_To_Learn_For_Jazz_Guitar_In_Order_.pdf",
  },
  {
    label: "Tomo Fujita — guitar diagnostics interview",
    note: "the bench test, time feel, and why slow is fast",
    url: "https://youtu.be/32ZbUVzeLG0",
  },
];

const card = "rounded-xl border border-neutral-800 bg-neutral-900/60 p-4";
const btn =
  "rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700 active:bg-neutral-600";
const input =
  "rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500";
const label = "text-xs uppercase tracking-wide text-neutral-500";

function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function ToolsView() {
  // --- metronome ---
  const metro = useRef<Metronome | null>(null);
  const getMetro = () => (metro.current ??= new Metronome());
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(100);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [sound, setSound] = useState<ClickSound>("beep");
  const [volume, setVolume] = useState(1);
  const [pulse, setPulse] = useState(-1);
  const taps = useRef<number[]>([]);

  // Speed trainer: +N bpm every M bars while running.
  const [trainer, setTrainer] = useState(false);
  const [trainerAdd, setTrainerAdd] = useState(4);
  const [trainerBars, setTrainerBars] = useState(4);
  const [moreOpen, setMoreOpen] = useState(false);
  const trainerRef = useRef({ on: false, add: 4, bars: 4 });
  useEffect(() => {
    trainerRef.current = { on: trainer, add: trainerAdd, bars: trainerBars };
  }, [trainer, trainerAdd, trainerBars]);

  // --- random key + drone ---
  const [note, setNote] = useState<{ cur: Note | null; next: Note | null }>({ cur: null, next: null });
  const noteRef = useRef(note);
  useEffect(() => {
    noteRef.current = note;
  }, [note]);
  const [noteSync, setNoteSync] = useState(0); // new key every N beats, 0 = off
  const noteSyncRef = useRef(0);
  useEffect(() => {
    noteSyncRef.current = noteSync;
  }, [noteSync]);
  const [droneOn, setDroneOn] = useState(false);
  const droneRef = useRef(false);
  const [droneVol, setDroneVol] = useState(0.5);
  // A2-rooted so the drone sits under the clicks.
  const droneHz = (idx: number) => 110 * Math.pow(2, idx / 12);

  const advanceNote = useCallback(() => {
    const cur = noteRef.current.next ?? randNote(noteRef.current.cur?.idx ?? null);
    const next = randNote(cur.idx);
    setNote({ cur, next });
    noteRef.current = { cur, next };
    if (droneRef.current) getMetro().playDrone(droneHz(cur.idx));
  }, []);

  // --- restore prefs ---
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      if (typeof p.bpm === "number") setBpm(clampBpm(p.bpm));
      if (typeof p.beatsPerBar === "number") setBeatsPerBar(p.beatsPerBar);
      if (p.sound === "beep" || p.sound === "wood" || p.sound === "tick") setSound(p.sound);
      if (typeof p.volume === "number") setVolume(Math.min(1, Math.max(0, p.volume)));
      if (typeof p.droneVol === "number") setDroneVol(Math.min(1, Math.max(0, p.droneVol)));
      if (typeof p.noteSync === "number") setNoteSync(p.noteSync);
      if (typeof p.trainer === "boolean") setTrainer(p.trainer);
      if (typeof p.trainerAdd === "number") setTrainerAdd(p.trainerAdd);
      if (typeof p.trainerBars === "number") setTrainerBars(p.trainerBars);
    } catch {}
    try {
      setFavs(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]"));
    } catch {}
    fetch("/api/youtube/search")
      .then((r) => r.json())
      .then((d) => setSearchEnabled(!!d.enabled))
      .catch(() => {});
  }, []);

  // Merge shared prefs back without clobbering log-page-only fields.
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
      localStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ ...p, bpm, beatsPerBar, sound, volume, droneVol, noteSync, trainer, trainerAdd, trainerBars })
      );
    } catch {}
  }, [bpm, beatsPerBar, sound, volume, droneVol, noteSync, trainer, trainerAdd, trainerBars]);

  // Live-update the engine.
  useEffect(() => {
    const m = getMetro();
    m.bpm = bpm;
    m.beatsPerBar = beatsPerBar;
    m.sound = sound;
    m.volume = volume;
  }, [bpm, beatsPerBar, sound, volume]);
  useEffect(() => {
    getMetro().setDroneVolume(droneVol);
  }, [droneVol]);

  const beatCount = useRef(0);
  const barCount = useRef(0);
  useEffect(() => {
    const m = getMetro();
    m.onBeat = (beatInBar) => {
      setPulse(beatInBar);
      const every = noteSyncRef.current;
      if (every > 0) {
        if (beatCount.current % every === 0) advanceNote();
        beatCount.current++;
      }
      if (beatInBar === 0) {
        const t = trainerRef.current;
        if (t.on && barCount.current > 0 && barCount.current % t.bars === 0) {
          setBpm((b) => {
            const nb = clampBpm(b + t.add);
            m.bpm = nb;
            return nb;
          });
        }
        barCount.current++;
      }
    };
  }, [advanceNote]);

  const toggleMetronome = useCallback(() => {
    const m = getMetro();
    if (m.running) {
      m.stop();
      setRunning(false);
      setPulse(-1);
    } else {
      beatCount.current = 0;
      barCount.current = 0;
      m.start();
      setRunning(true);
    }
  }, []);

  function tapTempo() {
    const now = performance.now();
    if (taps.current.length && now - taps.current[taps.current.length - 1] > 2000) taps.current = [];
    taps.current.push(now);
    taps.current = taps.current.slice(-6);
    if (taps.current.length >= 2) {
      const t = taps.current;
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1);
      setBpm(clampBpm(60000 / avg));
    }
  }

  const toggleDrone = useCallback(() => {
    const on = !droneRef.current;
    droneRef.current = on;
    setDroneOn(on);
    const m = getMetro();
    if (!on) {
      m.stopDrone();
      return;
    }
    if (noteRef.current.cur) m.playDrone(droneHz(noteRef.current.cur.idx));
    else advanceNote();
  }, [advanceNote]);

  // Keyboard parity with the log page: space start/stop, n new key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        toggleMetronome();
      }
      if (e.key === "n" || e.key === "N") advanceNote();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleMetronome, advanceNote]);

  useEffect(() => () => {
    metro.current?.stop();
    metro.current?.stopDrone();
  }, []);

  // --- timer (count-up, no logging) ---
  const [timerSec, setTimerSec] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => setTimerSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  // --- wake lock (mobile only) ---
  const [wakeAvail, setWakeAvail] = useState(false);
  const [awake, setAwake] = useState(false);
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);
  useEffect(() => {
    setWakeAvail("wakeLock" in navigator && window.matchMedia("(pointer: coarse)").matches);
  }, []);
  const toggleAwake = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release().catch(() => {});
      lockRef.current = null;
      setAwake(false);
      return;
    }
    try {
      const nav = navigator as Navigator & { wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void>; addEventListener: (t: string, f: () => void) => void }> } };
      const lock = await nav.wakeLock.request("screen");
      lock.addEventListener("release", () => {
        lockRef.current = null;
        setAwake(false);
      });
      lockRef.current = lock;
      setAwake(true);
    } catch {}
  }, []);

  // --- youtube ---
  const [ytInput, setYtInput] = useState("");
  const [playing, setPlaying] = useState<Fav | null>(null);
  const [favs, setFavs] = useState<Fav[]>([]);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  function saveFavs(next: Fav[]) {
    setFavs(next);
    localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  }

  async function submitYt() {
    const raw = ytInput.trim();
    if (!raw) return;
    const id = ytId(raw);
    if (id) {
      setPlaying({ id, title: raw });
      setResults(null);
      setYtInput("");
      return;
    }
    if (!searchEnabled) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/youtube/search?q=${encodeURIComponent(raw)}`);
      const d = await r.json();
      setResults(r.ok ? d.results : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  const isFav = playing && favs.some((f) => f.id === playing.id);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-lg font-semibold">Practice tools</h1>
          <nav className="flex gap-3 text-sm text-neutral-400">
            <a href="/practice/plan" className="hover:text-neutral-200">
              the plan →
            </a>
            <a href="/practice/log" className="hover:text-neutral-200">
              my log →
            </a>
          </nav>
        </header>

        {/* metronome */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <span className={label}>Metronome</span>
            <div className="flex gap-1.5">
              {Array.from({ length: beatsPerBar }, (_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    pulse === i ? (i === 0 ? "bg-amber-400" : "bg-neutral-200") : "bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={toggleMetronome}
              className={`h-16 w-16 shrink-0 rounded-full text-sm font-semibold ${
                running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {running ? "stop" : "start"}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">{bpm}</span>
                <span className="text-sm text-neutral-500">bpm</span>
              </div>
              <input
                type="range"
                min={20}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="mt-1 w-full accent-amber-500"
                aria-label="bpm"
              />
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button className={btn} onClick={() => setBpm((b) => clampBpm(b + 5))}>
                +5
              </button>
              <button className={btn} onClick={() => setBpm((b) => clampBpm(b - 5))}>
                −5
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-300">
            <button className={btn} onClick={tapTempo}>
              tap tempo
            </button>
            <label className="flex items-center gap-1.5">
              beats
              <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))} className={input}>
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              sound
              <select value={sound} onChange={(e) => setSound(e.target.value as ClickSound)} className={input}>
                <option value="beep">beep</option>
                <option value="wood">wood</option>
                <option value="tick">tick</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              vol
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 accent-amber-500"
                aria-label="click volume"
              />
            </label>
            <button className="text-neutral-500 hover:text-neutral-300" onClick={() => setMoreOpen((o) => !o)}>
              {moreOpen ? "less ▴" : "more ▾"}
            </button>
          </div>
          {moreOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-800 pt-3 text-sm text-neutral-300">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={trainer} onChange={(e) => setTrainer(e.target.checked)} className="accent-amber-500" />
                speed trainer: +
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={trainerAdd}
                onChange={(e) => setTrainerAdd(Math.max(1, Number(e.target.value)))}
                className={`${input} w-14`}
                aria-label="bpm added per step"
              />
              bpm every
              <input
                type="number"
                min={1}
                max={64}
                value={trainerBars}
                onChange={(e) => setTrainerBars(Math.max(1, Number(e.target.value)))}
                className={`${input} w-14`}
                aria-label="bars per step"
              />
              bars
            </div>
          )}
        </section>

        {/* random key + drone */}
        <section className={card}>
          <span className={label}>Random key</span>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={advanceNote}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-4xl font-bold hover:bg-neutral-700"
              title="new key (n)"
            >
              {note.cur?.label ?? "?"}
            </button>
            <div className="min-w-0 flex-1 space-y-2 text-sm text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">next:</span>
                <span className="font-medium">{note.next?.label ?? "—"}</span>
                <button className={btn} onClick={advanceNote}>
                  new key
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-1.5 whitespace-nowrap">
                  new key every
                  <select value={noteSync} onChange={(e) => setNoteSync(Number(e.target.value))} className={input} aria-label="auto key change interval">
                    <option value={0}>off</option>
                    {[1, 2, 3, 4, 6, 8, 12, 16, 32].map((n) => (
                      <option key={n} value={n}>
                        {n} beat{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className={`${btn} ${droneOn ? "border-amber-500 text-amber-400" : ""}`}
                  onClick={toggleDrone}
                  aria-pressed={droneOn}
                >
                  drone {droneOn ? "on" : "off"}
                </button>
                {droneOn && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={droneVol}
                    onChange={(e) => setDroneVol(Number(e.target.value))}
                    className="w-20 accent-amber-500"
                    aria-label="drone volume"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        {/* tuner */}
        <section className={card}>
          <span className={label}>Tuner</span>
          <div className="mt-2">
            <Tuner />
          </div>
        </section>

        {/* backing tracks */}
        <section className={card}>
          <span className={label}>Backing tracks</span>
          <div className="mt-2 flex gap-2">
            <input
              value={ytInput}
              onChange={(e) => setYtInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitYt()}
              placeholder={searchEnabled ? "paste a YouTube link or search…" : "paste a YouTube link…"}
              className={`${input} min-w-0 flex-1`}
            />
            <button className={btn} onClick={submitYt} disabled={searching}>
              {searching ? "…" : searchEnabled ? "go" : "play"}
            </button>
          </div>
          {results && (
            <ul className="mt-2 divide-y divide-neutral-800 rounded-md border border-neutral-800">
              {results.length === 0 && <li className="p-2 text-sm text-neutral-500">no results</li>}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-neutral-800/60"
                    onClick={() => {
                      setPlaying({ id: r.id, title: r.title });
                      setResults(null);
                      setYtInput("");
                    }}
                  >
                    {r.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.thumb} alt="" className="h-9 w-16 rounded object-cover" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate">{r.title}</span>
                      <span className="block truncate text-xs text-neutral-500">{r.channel}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {playing && (
            <div className="mt-3">
              <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border border-neutral-800">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1`}
                  title="backing track"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="mt-1.5 flex gap-3 text-sm">
                <button
                  className="text-neutral-400 hover:text-amber-400"
                  onClick={() =>
                    isFav
                      ? saveFavs(favs.filter((f) => f.id !== playing.id))
                      : saveFavs([...favs, { id: playing.id, title: playing.title.slice(0, 80) }])
                  }
                >
                  {isFav ? "★ saved" : "☆ save"}
                </button>
                <button className="text-neutral-500 hover:text-neutral-300" onClick={() => setPlaying(null)}>
                  close
                </button>
              </div>
            </div>
          )}
          {favs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {favs.map((f) => (
                <span key={f.id} className="flex items-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-800 text-xs">
                  <button className="max-w-[14rem] truncate px-2.5 py-1 hover:text-amber-400" onClick={() => setPlaying(f)} title={f.title}>
                    {f.title}
                  </button>
                  <button
                    className="pr-2 text-neutral-500 hover:text-red-400"
                    onClick={() => saveFavs(favs.filter((x) => x.id !== f.id))}
                    aria-label={`remove ${f.title}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* timer + wake lock */}
        <section className="flex flex-wrap items-center gap-2">
          <div className={`${card} flex items-center gap-3 py-2.5`}>
            <span className="text-xl font-semibold tabular-nums">{fmtClock(timerSec)}</span>
            <button className={btn} onClick={() => setTimerOn((o) => !o)}>
              {timerOn ? "pause" : timerSec > 0 ? "resume" : "start timer"}
            </button>
            {timerSec > 0 && !timerOn && (
              <button className="text-sm text-neutral-500 hover:text-neutral-300" onClick={() => setTimerSec(0)}>
                reset
              </button>
            )}
          </div>
          {wakeAvail && (
            <button className={`${card} py-2.5 text-sm ${awake ? "text-amber-400" : "text-neutral-300"}`} onClick={toggleAwake}>
              {awake ? "screen staying awake" : "keep screen awake"}
            </button>
          )}
        </section>

        {/* resources */}
        <section className={card}>
          <span className={label}>Learn from the pros</span>
          <ul className="mt-2 space-y-1.5 text-sm">
            {RESOURCES.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-neutral-200 underline decoration-neutral-700 underline-offset-2 hover:decoration-amber-500">
                  {r.url.endsWith(".pdf") ? "▤" : "▶"} {r.label}
                </a>
                <span className="text-neutral-500"> — {r.note}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
