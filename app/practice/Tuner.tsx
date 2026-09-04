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
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState("");

  const ctx = useRef<AudioContext | null>(null);
  const osc = useRef<{ nodes: OscillatorNode[]; gain: GainNode } | null>(null);
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
      for (const n of osc.current.nodes) n.stop(getCtx().currentTime + 0.1);
      osc.current = null;
    }
    setPlaying(null);
  }

  function toggleTone(i: number) {
    const wasPlaying = playing === i;
    stopTone();
    if (wasPlaying) return;
    const ac = getCtx();
    const gain = ac.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.22, ac.currentTime, 0.02);
    gain.connect(ac.destination);
    // Triangle fundamental plus a quiet in-tune octave: carries on phone
    // speakers without harsh highs, and no detune so the pitch stays a
    // trustworthy tuning reference.
    const nodes = (
      [
        ["triangle", STRINGS[i].freq, 1],
        ["sine", STRINGS[i].freq * 2, 0.4],
      ] as [OscillatorType, number, number][]
    ).map(([type, freq, level]) => {
      const node = ac.createOscillator();
      const og = ac.createGain();
      node.type = type;
      node.frequency.value = freq;
      og.gain.value = level;
      node.connect(og).connect(gain);
      node.start();
      return node;
    });
    osc.current = { nodes, gain };
    setPlaying(i);
  }

  async function startMic(id?: string) {
    stopTone(); // droning into the mic would tune the tuner
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: id ? { deviceId: { exact: id } } : true,
      });
      stream.current = s;
      const ac = getCtx();
      const src = ac.createMediaStreamSource(s);
      const analyser = ac.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      let last = 0;
      // Median over the last few detections irons out jitter and the odd
      // octave misfire; a few misses in a row before clearing stops flicker.
      const hist: number[] = [];
      let missed = 0;
      const loop = (t: number) => {
        raf.current = requestAnimationFrame(loop);
        if (t - last < 66) return; // ~15 checks/s — plenty, and O(n²) is warm
        last = t;
        analyser.getFloatTimeDomainData(buf);
        const freq = autoCorrelate(buf, ac.sampleRate);
        if (freq == null) {
          hist.length = 0;
          if (++missed > 5) setHeard(null);
          return;
        }
        missed = 0;
        hist.push(freq);
        if (hist.length > 7) hist.shift();
        const med = [...hist].sort((a, z) => a - z)[Math.floor(hist.length / 2)];
        const midi = Math.round(12 * Math.log2(med / 440)) + 69;
        const ref = 440 * Math.pow(2, (midi - 69) / 12);
        setHeard({
          name: `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`,
          cents: Math.round(1200 * Math.log2(med / ref)),
        });
      };
      raf.current = requestAnimationFrame(loop);
      setMicOn(true);
      // Labels only populate after permission is granted, so list them here.
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === "audioinput" && d.deviceId));
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
    { post: [9, 104] as const, nut: 14 }, // E
    { post: [9, 64] as const, nut: 19.6 }, // A
    { post: [9, 24] as const, nut: 25.2 }, // D
    { post: [47, 24] as const, nut: 30.8 }, // G
    { post: [47, 64] as const, nut: 36.4 }, // B
    { post: [47, 104] as const, nut: 42 }, // e
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
            <svg viewBox="0 0 56 128" className="h-32 w-14" aria-hidden>
              <path
                d="M12 112 L4 24 Q4 8 14 8 L42 8 Q52 8 52 24 L44 112 Z"
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
              <rect x="10" y="110" width="36" height="4" rx="1" fill="#737373" />
              <rect x="13" y="114" width="30" height="14" fill="none" stroke="#404040" strokeWidth="1" />
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
              onClick={() => (micOn ? stopMic() : startMic(deviceId || undefined))}
            >
              {micOn ? "mic off" : "🎤 mic"}
            </button>
            {micOn && devices.length > 1 && (
              <select
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                  stopMic();
                  void startMic(e.target.value || undefined);
                }}
                className="w-20 rounded border border-neutral-700 bg-neutral-900 px-1 py-0.5 text-[10px] text-neutral-400"
                title="Microphone"
              >
                <option value="">default</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `mic ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
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
