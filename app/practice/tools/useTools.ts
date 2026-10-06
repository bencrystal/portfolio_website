"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ClickSound, Metronome } from "../metronome";

// All the state + audio behind the /practice tools page, shared by every
// design variant so the ?redesign mockups are pure presentation.

// Shared with PracticeView so BPM/sound/volume prefs carry across both pages;
// read-merge-write so log-only prefs (instFilter, extrasOpen, …) survive.
const PREFS_KEY = "practice_prefs";
const FAVS_KEY = "practice_yt_favs";

export const clampBpm = (b: number) => Math.min(300, Math.max(20, Math.round(b)));

// 12 chromatic pitches; the black keys carry both spellings.
const NOTE_PAIRS: string[][] = [
  ["A"], ["A#", "Bb"], ["B"], ["C"], ["C#", "Db"], ["D"],
  ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"],
];
export type Note = { idx: number; label: string };
function randNote(excludeIdx: number | null): Note {
  let idx = excludeIdx;
  while (idx === excludeIdx) idx = Math.floor(Math.random() * 12);
  const pair = NOTE_PAIRS[idx!];
  return { idx: idx!, label: pair.length === 2 && Math.random() < 0.5 ? pair[1] : pair[0] };
}

// YouTube watch/share/shorts/embed links all yield the 11-char video id.
export function ytId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export type Fav = { id: string; title: string };
export type SearchResult = { id: string; title: string; channel: string; thumb: string | null };

// Curated outside material — knowledge and theory worth pointing friends at.
export const RESOURCES: { label: string; note: string; url: string }[] = [
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

export function fmtClock(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// Soft three-note chime (A–E–A) for the timer finish; quiet, short, warm.
function playChime(ctx: AudioContext) {
  const t0 = ctx.currentTime + 0.02;
  [220, 330, 440].forEach((freq, i) => {
    const t = t0 + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.2);
  });
}

export function useTools() {
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

  // --- timer (countdown; finishing plays a chime + the mini celebration) ---
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerLeft, setTimerLeft] = useState(25 * 60);
  const [timerOn, setTimerOn] = useState(false);
  const [timerMuted, setTimerMuted] = useState(false);
  const timerMutedRef = useRef(false);
  useEffect(() => {
    timerMutedRef.current = timerMuted;
  }, [timerMuted]);
  const [finished, setFinished] = useState(false);

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
      if (typeof p.timerMin === "number" && p.timerMin > 0) {
        setTimerTotal(p.timerMin * 60);
        setTimerLeft(p.timerMin * 60);
      }
      if (typeof p.timerMuted === "boolean") setTimerMuted(p.timerMuted);
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
        JSON.stringify({
          ...p,
          bpm, beatsPerBar, sound, volume, droneVol, noteSync, trainer, trainerAdd, trainerBars,
          timerMin: Math.round(timerTotal / 60),
          timerMuted,
        })
      );
    } catch {}
  }, [bpm, beatsPerBar, sound, volume, droneVol, noteSync, trainer, trainerAdd, trainerBars, timerTotal, timerMuted]);

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

  const tapTempo = useCallback(() => {
    const now = performance.now();
    if (taps.current.length && now - taps.current[taps.current.length - 1] > 2000) taps.current = [];
    taps.current.push(now);
    taps.current = taps.current.slice(-6);
    if (taps.current.length >= 2) {
      const t = taps.current;
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1);
      setBpm(clampBpm(60000 / avg));
    }
  }, []);

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

  // Countdown tick; hitting zero stops, chimes (unless muted) and raises
  // `finished` for ~3s so the UI can play its tiny celebration.
  useEffect(() => {
    if (!timerOn) return;
    const id = setInterval(() => {
      setTimerLeft((s) => {
        if (s <= 1) {
          setTimerOn(false);
          setFinished(true);
          setTimeout(() => setFinished(false), 3200);
          if (!timerMutedRef.current) {
            // Reuse the metronome's AudioContext habits: a fresh context here
            // is fine, the chime is rare and short.
            try {
              playChime(new AudioContext());
            } catch {}
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerOn]);

  const timerStart = useCallback(() => {
    setTimerLeft((s) => (s === 0 ? timerTotal : s));
    setTimerOn(true);
  }, [timerTotal]);
  const timerPause = useCallback(() => setTimerOn(false), []);
  const timerReset = useCallback(() => {
    setTimerOn(false);
    setTimerLeft(timerTotal);
  }, [timerTotal]);
  const timerSetMinutes = useCallback((min: number) => {
    const sec = Math.max(60, Math.round(min * 60));
    setTimerTotal(sec);
    setTimerLeft(sec);
    setTimerOn(false);
  }, []);

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
      const nav = navigator as Navigator & {
        wakeLock: { request: (t: "screen") => Promise<{ release: () => Promise<void>; addEventListener: (t: string, f: () => void) => void }> };
      };
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

  const saveFavs = useCallback((next: Fav[]) => {
    setFavs(next);
    localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  }, []);

  const submitYt = useCallback(async () => {
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
  }, [ytInput, searchEnabled]);

  return {
    // metronome
    running, bpm, setBpm, beatsPerBar, setBeatsPerBar, sound, setSound, volume, setVolume,
    pulse, toggleMetronome, tapTempo,
    trainer, setTrainer, trainerAdd, setTrainerAdd, trainerBars, setTrainerBars,
    // key + drone
    note, noteSync, setNoteSync, droneOn, droneVol, setDroneVol, advanceNote, toggleDrone,
    // timer
    timerTotal, timerLeft, timerOn, timerMuted, setTimerMuted, finished,
    timerStart, timerPause, timerReset, timerSetMinutes,
    // wake lock
    wakeAvail, awake, toggleAwake,
    // youtube
    ytInput, setYtInput, playing, setPlaying, favs, saveFavs, searchEnabled, results, setResults, searching, submitYt,
  };
}

export type ToolsEngine = ReturnType<typeof useTools>;
