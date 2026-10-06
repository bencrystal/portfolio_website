"use client";

import { useState } from "react";
import Tuner from "../Tuner";
import { ClickSound } from "../metronome";
import { useTools, clampBpm, fmtClock } from "./useTools";
import { BackingTracks, HeaderNav, Resources, card, label } from "./shared";
import TinyUnison from "./TinyUnison";

// Variant B — "Deck". A hi-fi rack: stacked hardware modules, mono numerals,
// LED meters, square transport buttons. Everything reads at a glance like
// gear on a shelf.

const unit = "rounded-lg border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 px-4 py-3";
const hwBtn =
  "rounded border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-xs uppercase tracking-wider text-neutral-200 hover:bg-neutral-700 active:translate-y-px";
const hwSelect =
  "rounded border border-neutral-700 bg-neutral-900 px-2 py-1.5 font-mono text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500";
const hwLabel = "font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-600";

export default function VariantB() {
  const t = useTools();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <HeaderNav />

        {/* metronome unit */}
        <section className={unit}>
          <div className="flex items-center justify-between">
            <span className={hwLabel}>metronome</span>
            {/* LED beat meter */}
            <div className="flex gap-1">
              {Array.from({ length: t.beatsPerBar }, (_, i) => (
                <span
                  key={i}
                  className={`h-3 w-1.5 rounded-[1px] transition-colors duration-75 ${
                    t.pulse === i ? (i === 0 ? "bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.9)]" : "bg-neutral-100") : "bg-neutral-800"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <button
              onClick={t.toggleMetronome}
              aria-pressed={t.running}
              className={`h-14 w-14 shrink-0 rounded font-mono text-[11px] uppercase tracking-wider ${
                t.running
                  ? "border border-amber-500 bg-amber-500/15 text-amber-400 shadow-[inset_0_0_10px_rgba(245,158,11,0.2)]"
                  : "border border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700"
              }`}
            >
              {t.running ? "stop" : "run"}
            </button>
            <div className="flex items-baseline gap-1 rounded border border-neutral-800 bg-black px-3 py-1.5">
              <span className="font-mono text-5xl font-medium tabular-nums text-amber-400 [text-shadow:0_0_12px_rgba(245,158,11,0.4)]">
                {String(t.bpm).padStart(3, "0")}
              </span>
              <span className="font-mono text-[10px] uppercase text-neutral-600">bpm</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <input
                type="range"
                min={20}
                max={300}
                value={t.bpm}
                onChange={(e) => t.setBpm(Number(e.target.value))}
                className="w-full accent-amber-500"
                aria-label="bpm"
              />
              <div className="flex gap-1.5">
                <button className={hwBtn} onClick={() => t.setBpm(clampBpm(t.bpm - 5))}>
                  −5
                </button>
                <button className={hwBtn} onClick={() => t.setBpm(clampBpm(t.bpm + 5))}>
                  +5
                </button>
                <button className={hwBtn} onClick={t.tapTempo}>
                  tap
                </button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-1.5">
              <span className={hwLabel}>beats</span>
              <select value={t.beatsPerBar} onChange={(e) => t.setBeatsPerBar(Number(e.target.value))} className={hwSelect}>
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className={hwLabel}>voice</span>
              <select value={t.sound} onChange={(e) => t.setSound(e.target.value as ClickSound)} className={hwSelect}>
                <option value="beep">beep</option>
                <option value="wood">wood</option>
                <option value="tick">tick</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className={hwLabel}>level</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={t.volume}
                onChange={(e) => t.setVolume(Number(e.target.value))}
                className="w-20 accent-amber-500"
                aria-label="click volume"
              />
            </label>
            <button className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 hover:text-neutral-300" onClick={() => setMoreOpen((o) => !o)}>
              {moreOpen ? "− trainer" : "+ trainer"}
            </button>
            {moreOpen && (
              <span className="flex items-center gap-1.5 font-mono text-xs text-neutral-300">
                <input type="checkbox" checked={t.trainer} onChange={(e) => t.setTrainer(e.target.checked)} className="accent-amber-500" />
                +
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={t.trainerAdd}
                  onChange={(e) => t.setTrainerAdd(Math.max(1, Number(e.target.value)))}
                  className={`${hwSelect} w-12`}
                />
                bpm /
                <input
                  type="number"
                  min={1}
                  max={64}
                  value={t.trainerBars}
                  onChange={(e) => t.setTrainerBars(Math.max(1, Number(e.target.value)))}
                  className={`${hwSelect} w-12`}
                />
                bars
              </span>
            )}
          </div>
        </section>

        {/* key + session units side by side */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className={unit}>
            <span className={hwLabel}>key generator</span>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={t.advanceNote}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-neutral-800 bg-black font-mono text-3xl font-medium text-amber-400 [text-shadow:0_0_12px_rgba(245,158,11,0.4)] hover:border-neutral-600"
                title="new key (n)"
              >
                {t.note.cur?.label ?? "--"}
              </button>
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-600">
                  next {t.note.next?.label ?? "--"}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <select value={t.noteSync} onChange={(e) => t.setNoteSync(Number(e.target.value))} className={hwSelect} aria-label="auto key change interval">
                    <option value={0}>manual</option>
                    {[1, 2, 3, 4, 6, 8, 12, 16, 32].map((n) => (
                      <option key={n} value={n}>
                        every {n}
                      </option>
                    ))}
                  </select>
                  <button
                    className={`${hwBtn} ${t.droneOn ? "border-amber-500 text-amber-400" : ""}`}
                    onClick={t.toggleDrone}
                    aria-pressed={t.droneOn}
                  >
                    drone
                  </button>
                </div>
                {t.droneOn && (
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={t.droneVol}
                    onChange={(e) => t.setDroneVol(Number(e.target.value))}
                    className="w-24 accent-amber-500"
                    aria-label="drone volume"
                  />
                )}
              </div>
            </div>
          </div>

          <div className={unit}>
            <span className={hwLabel}>session</span>
            <div className="mt-2 flex items-center gap-3">
              {t.finished ? (
                <TinyUnison width={200} height={52} />
              ) : (
                <>
                  <span className="rounded border border-neutral-800 bg-black px-3 py-1.5 font-mono text-3xl tabular-nums text-amber-400 [text-shadow:0_0_12px_rgba(245,158,11,0.4)]">
                    {fmtClock(t.timerLeft)}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <button className={hwBtn} onClick={t.timerOn ? t.timerPause : t.timerStart}>
                        {t.timerOn ? "pause" : "run"}
                      </button>
                      <button className={hwBtn} onClick={t.timerReset}>
                        reset
                      </button>
                      <button
                        className={`${hwBtn} ${t.timerMuted ? "text-neutral-600" : "text-amber-400"}`}
                        onClick={() => t.setTimerMuted(!t.timerMuted)}
                        aria-pressed={t.timerMuted}
                        title="finish sound"
                      >
                        ♪
                      </button>
                    </div>
                    <select
                      className={hwSelect}
                      value={Math.round(t.timerTotal / 60)}
                      onChange={(e) => t.timerSetMinutes(Number(e.target.value))}
                      disabled={t.timerOn}
                      aria-label="session length"
                    >
                      {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                        <option key={m} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {t.wakeAvail && (
          <button
            className={`${unit} text-left font-mono text-xs uppercase tracking-widest ${t.awake ? "text-amber-400" : "text-neutral-400"}`}
            onClick={t.toggleAwake}
          >
            {t.awake ? "● screen hold on" : "○ screen hold"}
          </button>
        )}

        <section className={unit}>
          <Tuner />
        </section>

        <section className={unit}>
          <span className={hwLabel}>backing tracks</span>
          <BackingTracks t={t} />
        </section>

        <section className={card}>
          <span className={label}>Learn from the pros</span>
          <Resources />
        </section>
      </div>
    </main>
  );
}
