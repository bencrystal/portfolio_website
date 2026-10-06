"use client";

import { useState } from "react";
import Tuner from "../Tuner";
import { ClickSound } from "../metronome";
import { useTools, clampBpm, fmtClock } from "./useTools";
import { BackingTracks, HeaderNav, Resources, btn, card, input, label } from "./shared";
import TinyUnison from "./TinyUnison";

// Variant A — "Dial". One iconic shape, the circle: the metronome is a big
// breathing dial, the key is a coin, the timer is a draining ring. Touch
// targets are the shapes themselves.

function TimerRing({ t }: { t: ReturnType<typeof useTools> }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const frac = t.timerTotal > 0 ? t.timerLeft / t.timerTotal : 0;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#262626" strokeWidth="4" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <button
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums"
        onClick={t.timerOn ? t.timerPause : t.timerStart}
        title={t.timerOn ? "pause" : "start"}
      >
        {fmtClock(t.timerLeft)}
      </button>
    </div>
  );
}

export default function VariantA() {
  const t = useTools();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <HeaderNav />

        {/* hero: dial + coin + ring */}
        <section className="flex flex-wrap items-center justify-center gap-8 py-4">
          {/* metronome dial */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={t.toggleMetronome}
              aria-pressed={t.running}
              className={`relative flex h-56 w-56 flex-col items-center justify-center rounded-full border transition-colors ${
                t.running ? "border-amber-500/60 bg-amber-500/5" : "border-neutral-700 bg-neutral-900/60 hover:border-neutral-500"
              }`}
            >
              {/* beat pulse halo */}
              <span
                key={t.pulse >= 0 ? `${t.pulse}-${t.bpm}` : "off"}
                className={`pointer-events-none absolute inset-0 rounded-full ${
                  t.running ? (t.pulse === 0 ? "animate-ping-once-strong" : "animate-ping-once") : ""
                }`}
              />
              <span className="text-6xl font-bold tabular-nums">{t.bpm}</span>
              <span className="text-xs uppercase tracking-widest text-neutral-500">{t.running ? "tap to stop" : "tap to start"}</span>
              <span className="mt-2 flex gap-1.5">
                {Array.from({ length: t.beatsPerBar }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${
                      t.pulse === i ? (i === 0 ? "bg-amber-400" : "bg-neutral-200") : "bg-neutral-700"
                    }`}
                  />
                ))}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm - 5))}>
                −5
              </button>
              <input
                type="range"
                min={20}
                max={300}
                value={t.bpm}
                onChange={(e) => t.setBpm(Number(e.target.value))}
                className="w-40 accent-amber-500"
                aria-label="bpm"
              />
              <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm + 5))}>
                +5
              </button>
              <button className={btn} onClick={t.tapTempo}>
                tap
              </button>
            </div>
          </div>

          {/* key coin + timer ring */}
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={t.advanceNote}
                className="flex h-28 w-28 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/60 text-5xl font-bold hover:border-neutral-500"
                title="new key (n)"
              >
                {t.note.cur?.label ?? "?"}
              </button>
              <span className="text-xs text-neutral-500">
                key · next {t.note.next?.label ?? "—"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              {t.finished ? <TinyUnison width={160} height={48} /> : <TimerRing t={t} />}
              <span className="text-xs text-neutral-500">session</span>
            </div>
          </div>
        </section>

        {/* settings line under the hero */}
        <section className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-300">
          <label className="flex items-center gap-1.5">
            beats
            <select value={t.beatsPerBar} onChange={(e) => t.setBeatsPerBar(Number(e.target.value))} className={input}>
              {[2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            sound
            <select value={t.sound} onChange={(e) => t.setSound(e.target.value as ClickSound)} className={input}>
              <option value="beep">beep</option>
              <option value="wood">wood</option>
              <option value="tick">tick</option>
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            new key every
            <select value={t.noteSync} onChange={(e) => t.setNoteSync(Number(e.target.value))} className={input}>
              <option value={0}>off</option>
              {[1, 2, 3, 4, 6, 8, 12, 16, 32].map((n) => (
                <option key={n} value={n}>
                  {n} beat{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            className={`${btn} ${t.droneOn ? "border-amber-500 text-amber-400" : ""}`}
            onClick={t.toggleDrone}
            aria-pressed={t.droneOn}
          >
            drone
          </button>
          {t.droneOn && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={t.droneVol}
              onChange={(e) => t.setDroneVol(Number(e.target.value))}
              className="w-20 accent-amber-500"
              aria-label="drone volume"
            />
          )}
          <label className="flex items-center gap-1.5">
            session
            <select
              className={input}
              value={Math.round(t.timerTotal / 60)}
              onChange={(e) => t.timerSetMinutes(Number(e.target.value))}
              disabled={t.timerOn}
            >
              {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </label>
          <button
            className={`text-xs ${t.timerMuted ? "text-neutral-600" : "text-neutral-400"} hover:text-neutral-200`}
            onClick={() => t.setTimerMuted(!t.timerMuted)}
            aria-pressed={t.timerMuted}
          >
            {t.timerMuted ? "♪ muted" : "♪ sound"}
          </button>
          {t.wakeAvail && (
            <button className={`${btn} ${t.awake ? "border-amber-500 text-amber-400" : ""}`} onClick={t.toggleAwake}>
              keep awake
            </button>
          )}
          <button className="text-neutral-500 hover:text-neutral-300" onClick={() => setMoreOpen((o) => !o)}>
            {moreOpen ? "less ▴" : "more ▾"}
          </button>
        </section>
        {moreOpen && (
          <section className="flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-300">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={t.trainer} onChange={(e) => t.setTrainer(e.target.checked)} className="accent-amber-500" />
              speed trainer: +
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={t.trainerAdd}
              onChange={(e) => t.setTrainerAdd(Math.max(1, Number(e.target.value)))}
              className={`${input} w-14`}
            />
            bpm every
            <input
              type="number"
              min={1}
              max={64}
              value={t.trainerBars}
              onChange={(e) => t.setTrainerBars(Math.max(1, Number(e.target.value)))}
              className={`${input} w-14`}
            />
            bars
            <label className="ml-3 flex items-center gap-1.5">
              click vol
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={t.volume}
                onChange={(e) => t.setVolume(Number(e.target.value))}
                className="w-20 accent-amber-500"
              />
            </label>
          </section>
        )}

        <section className={card}>
          <Tuner />
        </section>

        <section className={card}>
          <span className={label}>Backing tracks</span>
          <BackingTracks t={t} />
        </section>

        <section className={card}>
          <span className={label}>Learn from the pros</span>
          <Resources />
        </section>
      </div>

      {/* one-shot pulse keyframes for the dial halo */}
      <style jsx global>{`
        @keyframes toolsPing {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.35); }
          100% { box-shadow: 0 0 0 14px rgba(245, 158, 11, 0); }
        }
        .animate-ping-once { animation: toolsPing 0.5s ease-out 1; }
        .animate-ping-once-strong { animation: toolsPing 0.6s ease-out 1; }
      `}</style>
    </main>
  );
}
