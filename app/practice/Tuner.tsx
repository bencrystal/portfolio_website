"use client";

import { useEffect, useRef, useState } from "react";

// Compact guitar tuner, collapsed to one row until opened. Six reference-tone
// "pegs" sit around a little 3+3 headstock (tap to drone the string), and mic
// mode detects what you're playing (time-domain autocorrelation) and shows a
// cents needle. No dependencies — everything is Web Audio.

const STRINGS = [
  { label: "E", freq: 82.41 },
  { label: "A", freq: 110.0 },
  { label: "D", freq: 146.83 },
  { label: "G", freq: 196.0 },
  { label: "B", freq: 246.94 },
  { label: "e", freq: 329.63 },
];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Classic ACF2+ autocorrelation: trim leading/trailing silence, correlate,
// take the first strong peak past the initial slope, refine parabolically.
function autoCorrelate(input: Float32Array, sampleRate: number): number | null {
  let size = input.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += input[i] * input[i];
  if (Math.sqrt(rms / size) < 0.01) return null; // too quiet to call it a note

  let r1 = 0;
  let r2 = size - 1;
  for (let i = 0; i < size / 2; i++)
    if (Math.abs(input[i]) < 0.2) {
      r1 = i;
      break;
    }
  for (let i = 1; i < size / 2; i++)
    if (Math.abs(input[size - i]) < 0.2) {
      r2 = size - i;
      break;
    }
  const buf = input.slice(r1, r2);
  size = buf.length;
  if (size < 4) return null;

  const c = new Array<number>(size).fill(0);
  for (let i = 0; i < size; i++) for (let j = 0; j < size - i; j++) c[i] += buf[j] * buf[j + i];

  let d = 0;
  while (d < size - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < size; i++)
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  if (maxpos <= 0) return null;
  let T0 = maxpos;
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? x2;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  const freq = sampleRate / T0;
  return freq >= 60 && freq <= 1200 ? freq : null; // guitar-ish range only
}

export default function Tuner() {
  const [open, setOpen] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null); // peg index
  const [heard, setHeard] = useState<{ name: string; cents: number } | null>(null);

  const ctx = useRef<AudioContext | null>(null);
  const osc = useRef<{ node: OscillatorNode; gain: GainNode } | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);

  function getCtx() {
    ctx.current ??= new AudioContext();
    void ctx.current.resume();
    return ctx.current;
  }

  function stopTone() {
    if (osc.current) {
      osc.current.gain.gain.setTargetAtTime(0, getCtx().currentTime, 0.02);
      osc.current.node.stop(getCtx().currentTime + 0.1);
      osc.current = null;
    }
    setPlaying(null);
  }

  function toggleTone(i: number) {
    const wasPlaying = playing === i;
    stopTone();
    if (wasPlaying) return;
    const ac = getCtx();
    const node = ac.createOscillator();
    const gain = ac.createGain();
    node.type = "triangle"; // a few harmonics so the low E carries on phone speakers
    node.frequency.value = STRINGS[i].freq;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.15, ac.currentTime, 0.02);
    node.connect(gain).connect(ac.destination);
    node.start();
    osc.current = { node, gain };
    setPlaying(i);
  }

  async function toggleMic() {
    if (micOn) {
      stopMic();
      return;
    }
    stopTone(); // droning into the mic would tune the tuner
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const ac = getCtx();
      const src = ac.createMediaStreamSource(s);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let last = 0;
      const loop = (t: number) => {
        raf.current = requestAnimationFrame(loop);
        if (t - last < 66) return; // ~15 checks/s — plenty, and O(n²) is warm
        last = t;
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ac.sampleRate);
        if (freq == null) {
          setHeard(null);
          return;
        }
        const midi = Math.round(12 * Math.log2(freq / 440)) + 69;
        const ref = 440 * Math.pow(2, (midi - 69) / 12);
        setHeard({
          name: `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`,
          cents: Math.round(1200 * Math.log2(freq / ref)),
        });
      };
      raf.current = requestAnimationFrame(loop);
      setMicOn(true);
    } catch {
      // Mic denied — the pegs still work.
    }
  }

  function stopMic() {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setMicOn(false);
    setHeard(null);
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      stream.current?.getTracks().forEach((t) => t.stop());
      void ctx.current?.close();
    },
    []
  );

  // 3+3 headstock, as seen from the front: low E nearest the nut on the left.
  const leftPegs = [2, 1, 0]; // D A E top-to-bottom
  const rightPegs = [3, 4, 5]; // G B e top-to-bottom
  // String geometry in headstock-SVG space: tuning-post position (aligned to
  // the peg button rows) and where the string sits in the nut.
  const STRING_GEO = [
    { post: [10, 104] as const, nut: 11 }, // E
    { post: [10, 64] as const, nut: 15.4 }, // A
    { post: [10, 24] as const, nut: 19.8 }, // D
    { post: [34, 24] as const, nut: 24.2 }, // G
    { post: [34, 64] as const, nut: 28.6 }, // B
    { post: [34, 104] as const, nut: 33 }, // e
  ];
  const inTune = heard != null && Math.abs(heard.cents) <= 5;

  const peg = (i: number) => (
    <button
      key={i}
      onClick={() => toggleTone(i)}
      title={`${STRINGS[i].label} — ${STRINGS[i].freq} Hz reference tone`}
      className={`h-8 w-8 rounded-full border text-xs font-semibold transition-colors ${
        playing === i
          ? "border-amber-400 bg-amber-500 text-neutral-950"
          : "border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-neutral-400"
      }`}
    >
      {STRINGS[i].label}
    </button>
  );

  return (
    <div>
      <button
        className="flex w-full items-center justify-between text-sm font-medium text-neutral-400"
        onClick={() => {
          if (open) {
            stopTone();
            stopMic();
          }
          setOpen(!open);
        }}
      >
        Tuner
        <span className="text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="mt-2">
          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col gap-2">{leftPegs.map(peg)}</div>
            {/* The headstock: tapered paddle, six strings running from their
                posts over the nut onto a neck stub. The playing string lights
                up. Decorative, but it makes the peg layout read instantly. */}
            <svg viewBox="0 0 44 128" className="h-32 w-11" aria-hidden>
              <path
                d="M10 112 L6 24 Q6 8 16 8 L28 8 Q38 8 38 24 L34 112 Z"
                fill="#262626"
                stroke="#404040"
                strokeWidth="1"
              />
              {STRING_GEO.map((g, i) => (
                <g key={i} stroke={playing === i ? "#f59e0b" : "#525252"} strokeWidth={1.4 - i * 0.12}>
                  <line x1={g.post[0]} y1={g.post[1]} x2={g.nut} y2={110} />
                  <line x1={g.nut} y1={114} x2={g.nut} y2={128} />
                </g>
              ))}
              <rect x="8" y="110" width="28" height="4" rx="1" fill="#737373" />
              <rect x="10" y="114" width="24" height="14" fill="none" stroke="#404040" strokeWidth="1" />
              {STRING_GEO.map((g, i) => (
                <circle
                  key={i}
                  cx={g.post[0]}
                  cy={g.post[1]}
                  r={2.5}
                  fill={playing === i ? "#f59e0b" : "#a3a3a3"}
                />
              ))}
            </svg>
            <div className="flex flex-col gap-2">{rightPegs.map(peg)}</div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              className={`rounded-md border px-2 py-1 text-xs ${
                micOn
                  ? "border-amber-500/50 text-amber-400"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
              onClick={toggleMic}
            >
              {micOn ? "mic off" : "🎤 mic"}
            </button>
            {micOn && (
              <div className="flex items-center gap-2">
                {/* ±50¢ needle; green in the middle means in tune. */}
                <div className="relative h-1.5 w-24 rounded bg-neutral-800">
                  <span className="absolute left-1/2 top-[-3px] h-3 w-px bg-neutral-500" />
                  {heard && (
                    <span
                      className={`absolute top-[-3px] h-3 w-1 -translate-x-1/2 rounded ${
                        inTune ? "bg-green-400" : "bg-amber-400"
                      }`}
                      style={{ left: `${50 + (Math.max(-50, Math.min(50, heard.cents)) / 50) * 48}%` }}
                    />
                  )}
                </div>
                <span className={`w-16 text-xs tabular-nums ${inTune ? "text-green-400" : "text-neutral-400"}`}>
                  {heard ? `${heard.name} ${heard.cents > 0 ? "+" : ""}${heard.cents}¢` : "…"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
