"use client";

import { useState } from "react";
import Tuner from "../Tuner";
import { ClickSound } from "../metronome";
import { useTools, clampBpm, fmtClock } from "./useTools";
import { BackingTracks, HeaderNav, Resources, btn, card, input, label } from "./shared";
import TinyUnison from "./TinyUnison";

// Variant C — "Poster". Editorial big-type: the page is one composition, the
// numbers ARE the interface. Tap the giant bpm to start, tap the giant key
// letter for a new key. Chrome only appears where a finger needs it.

export default function VariantC() {
  const t = useTools();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-6 text-neutral-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <HeaderNav />

        {/* the composition */}
        <section className="mt-6 flex items-end justify-between gap-4">
          <button onClick={t.toggleMetronome} aria-pressed={t.running} className="group text-left">
            <span className={`block text-[10px] uppercase tracking-[0.3em] ${t.running ? "text-amber-500" : "text-neutral-600"}`}>
              {t.running ? "■ stop" : "▶ play"} · {t.beatsPerBar}/4 {t.sound}
            </span>
            <span
              className={`block font-bold leading-none tabular-nums transition-transform duration-100 ${
                t.running ? "text-neutral-50" : "text-neutral-300 group-hover:text-neutral-100"
              }`}
              style={{
                fontSize: "clamp(6rem, 22vw, 11rem)",
                transform: t.running && t.pulse === 0 ? "scale(1.015)" : "scale(1)",
                transformOrigin: "left bottom",
              }}
            >
              {t.bpm}
            </span>
          </button>
          <button onClick={t.advanceNote} className="group pb-2 text-right" title="new key (n)">
            <span className="block text-[10px] uppercase tracking-[0.3em] text-neutral-600">
              key · next {t.note.next?.label ?? "—"}
            </span>
            <span
              className="block font-bold leading-none text-amber-500 transition-colors group-hover:text-amber-400"
              style={{ fontSize: "clamp(4rem, 14vw, 7rem)" }}
            >
              {t.note.cur?.label ?? "?"}
            </span>
          </button>
        </section>

        {/* beat ribbon — a full-width line that fills per beat */}
        <div className="flex h-1 gap-1" aria-hidden>
          {Array.from({ length: t.beatsPerBar }, (_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full transition-colors duration-75 ${
                t.pulse === i ? (i === 0 ? "bg-amber-500" : "bg-neutral-200") : "bg-neutral-800"
              }`}
            />
          ))}
        </div>

        {/* controls strip */}
        <section className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-300">
          <input
            type="range"
            min={20}
            max={300}
            value={t.bpm}
            onChange={(e) => t.setBpm(Number(e.target.value))}
            className="w-full accent-amber-500"
            aria-label="bpm"
          />
          <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm - 5))}>
            −5
          </button>
          <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm + 5))}>
            +5
          </button>
          <button className={btn} onClick={t.tapTempo}>
            tap tempo
          </button>
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
          <button className="text-neutral-500 hover:text-neutral-300" onClick={() => setMoreOpen((o) => !o)}>
            {moreOpen ? "less ▴" : "more ▾"}
          </button>
        </section>
        {moreOpen && (
          <section className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-300">
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
              vol
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
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={t.trainer} onChange={(e) => t.setTrainer(e.target.checked)} className="accent-amber-500" />
              trainer +
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={t.trainerAdd}
              onChange={(e) => t.setTrainerAdd(Math.max(1, Number(e.target.value)))}
              className={`${input} w-14`}
            />
            /
            <input
              type="number"
              min={1}
              max={64}
              value={t.trainerBars}
              onChange={(e) => t.setTrainerBars(Math.max(1, Number(e.target.value)))}
              className={`${input} w-14`}
            />
            bars
          </section>
        )}

        {/* session line — quiet, typographic */}
        <section className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-neutral-900 pt-4">
          {t.finished ? (
            <TinyUnison width={260} height={52} />
          ) : (
            <>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-600">session</span>
              <button
                className="text-3xl font-semibold tabular-nums hover:text-amber-400"
                onClick={t.timerOn ? t.timerPause : t.timerStart}
                title={t.timerOn ? "pause" : "start"}
              >
                {fmtClock(t.timerLeft)}
              </button>
              <select
                className={input}
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
              {t.timerLeft < t.timerTotal && !t.timerOn && (
                <button className="text-sm text-neutral-500 hover:text-neutral-300" onClick={t.timerReset}>
                  reset
                </button>
              )}
              <button
                className={`text-sm ${t.timerMuted ? "text-neutral-600" : "text-neutral-400"} hover:text-neutral-200`}
                onClick={() => t.setTimerMuted(!t.timerMuted)}
                aria-pressed={t.timerMuted}
              >
                {t.timerMuted ? "♪ muted" : "♪ sound"}
              </button>
              {t.wakeAvail && (
                <button className={`text-sm ${t.awake ? "text-amber-400" : "text-neutral-500"} hover:text-neutral-300`} onClick={t.toggleAwake}>
                  keep awake
                </button>
              )}
            </>
          )}
        </section>

        <section className="mt-2 border-t border-neutral-900 pt-4">
          <Tuner />
        </section>

        <section className="border-t border-neutral-900 pt-4">
          <span className={label}>Backing tracks</span>
          <BackingTracks t={t} />
        </section>

        <section className={`${card} mt-4`}>
          <span className={label}>Learn from the pros</span>
          <Resources />
        </section>
      </div>
    </main>
  );
}
