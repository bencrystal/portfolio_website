"use client";

import { useState } from "react";
import Tuner from "./Tuner";
import { ClickSound } from "./metronome";
import { useTools, clampBpm, fmtClock } from "./tools/useTools";
import { BackingTracks, HeaderNav, Resources, btn, card, input, label } from "./tools/shared";
import TinyUnison from "./tools/TinyUnison";

// Tools-only landing for /practice: metronome, random key + drone, tuner,
// compact backing-track player, countdown timer, and curated external
// resources — no accounts, no logging. The full log lives at /practice/log.

export default function ToolsView() {
  const t = useTools();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <HeaderNav />

        {/* metronome */}
        <section className={card}>
          <div className="flex items-center justify-between">
            <span className={label}>Metronome</span>
            <div className="flex gap-1.5">
              {Array.from({ length: t.beatsPerBar }, (_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${
                    t.pulse === i ? (i === 0 ? "bg-amber-400" : "bg-neutral-200") : "bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={t.toggleMetronome}
              className={`h-16 w-16 shrink-0 rounded-full text-sm font-semibold ${
                t.running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {t.running ? "stop" : "start"}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums">{t.bpm}</span>
                <span className="text-sm text-neutral-500">bpm</span>
              </div>
              <input
                type="range"
                min={20}
                max={300}
                value={t.bpm}
                onChange={(e) => t.setBpm(Number(e.target.value))}
                className="mt-1 w-full accent-amber-500"
                aria-label="bpm"
              />
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm + 5))}>
                +5
              </button>
              <button className={btn} onClick={() => t.setBpm(clampBpm(t.bpm - 5))}>
                −5
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-300">
            <button className={btn} onClick={t.tapTempo}>
              tap tempo
            </button>
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
                <input
                  type="checkbox"
                  checked={t.trainer}
                  onChange={(e) => t.setTrainer(e.target.checked)}
                  className="accent-amber-500"
                />
                speed trainer: +
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={t.trainerAdd}
                onChange={(e) => t.setTrainerAdd(Math.max(1, Number(e.target.value)))}
                className={`${input} w-14`}
                aria-label="bpm added per step"
              />
              bpm every
              <input
                type="number"
                min={1}
                max={64}
                value={t.trainerBars}
                onChange={(e) => t.setTrainerBars(Math.max(1, Number(e.target.value)))}
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
              onClick={t.advanceNote}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-4xl font-bold hover:bg-neutral-700"
              title="new key (n)"
            >
              {t.note.cur?.label ?? "?"}
            </button>
            <div className="min-w-0 flex-1 space-y-2 text-sm text-neutral-300">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">next:</span>
                <span className="font-medium">{t.note.next?.label ?? "—"}</span>
                <button className={btn} onClick={t.advanceNote}>
                  new key
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-1.5 whitespace-nowrap">
                  new key every
                  <select
                    value={t.noteSync}
                    onChange={(e) => t.setNoteSync(Number(e.target.value))}
                    className={input}
                    aria-label="auto key change interval"
                  >
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
                  drone {t.droneOn ? "on" : "off"}
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
              </div>
            </div>
          </div>
        </section>

        {/* tuner — the component brings its own collapsed row, no extra card chrome */}
        <section className={card}>
          <Tuner />
        </section>

        {/* backing tracks */}
        <section className={card}>
          <span className={label}>Backing tracks</span>
          <BackingTracks t={t} />
        </section>

        {/* session timer + wake lock */}
        <section className="flex flex-wrap items-center gap-2">
          <div className={`${card} flex flex-wrap items-center gap-3 py-2.5`}>
            {t.finished ? (
              <TinyUnison />
            ) : (
              <>
                <span className="text-xl font-semibold tabular-nums">{fmtClock(t.timerLeft)}</span>
                <select
                  className={input}
                  value={Math.round(t.timerTotal / 60)}
                  onChange={(e) => t.timerSetMinutes(Number(e.target.value))}
                  aria-label="session length"
                  disabled={t.timerOn}
                >
                  {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} min
                    </option>
                  ))}
                </select>
                <button className={btn} onClick={t.timerOn ? t.timerPause : t.timerStart}>
                  {t.timerOn ? "pause" : t.timerLeft < t.timerTotal && t.timerLeft > 0 ? "resume" : "start session"}
                </button>
                {t.timerLeft < t.timerTotal && !t.timerOn && (
                  <button className="text-sm text-neutral-500 hover:text-neutral-300" onClick={t.timerReset}>
                    reset
                  </button>
                )}
                <button
                  className={`text-sm ${t.timerMuted ? "text-neutral-600" : "text-neutral-400"} hover:text-neutral-200`}
                  onClick={() => t.setTimerMuted(!t.timerMuted)}
                  aria-pressed={t.timerMuted}
                  title={t.timerMuted ? "finish sound muted" : "finish sound on"}
                >
                  {t.timerMuted ? "♪ muted" : "♪ sound"}
                </button>
              </>
            )}
          </div>
          {t.wakeAvail && (
            <button
              className={`${card} py-2.5 text-sm ${t.awake ? "text-amber-400" : "text-neutral-300"}`}
              onClick={t.toggleAwake}
            >
              {t.awake ? "screen staying awake" : "keep screen awake"}
            </button>
          )}
        </section>

        {/* resources */}
        <section className={card}>
          <span className={label}>Learn from the pros</span>
          <Resources />
        </section>
      </div>
    </main>
  );
}
