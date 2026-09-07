"use client";

// Attempt D — "Hybrid": A's checklist skeleton, B's queue dots + big-timer
// treatment inside the expanded row, and C's unified transport bar — a slim
// bottom bar that exists only while a timed exercise is open, so controls
// never move and check-offs stay one-tap rows.

import { useState } from "react";
import { MOCK_EXERCISES, MOCK_STATS } from "./mock";

export default function AttemptD() {
  const [openId, setOpenId] = useState<string | null>("caged");
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(76);
  const [metroOn, setMetroOn] = useState(true);
  const [drone, setDrone] = useState(false);

  const open = MOCK_EXERCISES.find((e) => e.id === openId) ?? null;
  const barVisible = !!open && !open.tools.check_off;

  return (
    <main className={`mx-auto min-h-screen max-w-lg bg-neutral-950 px-5 text-neutral-100 ${barVisible ? "pb-28" : "pb-16"}`}>
      <header className="flex items-baseline justify-between pb-2 pt-8">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">practice</h1>
        <nav className="flex gap-4 text-xs text-neutral-600">
          <span className="cursor-pointer hover:text-neutral-300">syllabus</span>
          <span className="cursor-pointer hover:text-neutral-300">history</span>
          <span className="cursor-pointer hover:text-neutral-300">edit</span>
        </nav>
      </header>

      {/* B's queue dots as the day's progress line, plus the quiet stats. */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex gap-1.5">
          {MOCK_EXERCISES.map((e) => (
            <button
              key={e.id}
              onClick={() => setOpenId(e.id)}
              aria-label={e.name}
              className={`h-1.5 rounded-full transition-all ${
                e.id === openId ? "w-6 bg-neutral-100" : e.doneToday ? "w-1.5 bg-amber-500" : "w-1.5 bg-neutral-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {MOCK_STATS.todayMin} min · <span className="text-amber-500">{MOCK_STATS.streak}-day streak</span>
        </p>
      </div>

      <ul className="divide-y divide-neutral-900">
        {MOCK_EXERCISES.map((ex) => {
          const isOpen = openId === ex.id;
          return (
            <li key={ex.id}>
              <button
                className="flex w-full items-center gap-3 py-3.5 text-left"
                onClick={() => setOpenId(isOpen ? null : ex.id)}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                    ex.doneToday
                      ? "border-amber-500 bg-amber-500 text-neutral-950"
                      : isOpen
                        ? "border-amber-500 text-amber-500"
                        : "border-neutral-700 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${ex.doneToday && !isOpen ? "text-neutral-600" : ""}`}>
                  {ex.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {ex.doneToday ? ex.todayLabel : ex.instrument ?? ""}
                </span>
              </button>

              {isOpen && (
                <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  {ex.desc && <p className="mb-3 text-xs text-neutral-500">{ex.desc}</p>}

                  {ex.tools.check_off ? (
                    <button className="w-full rounded-lg border border-amber-500/60 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/10">
                      {ex.doneToday ? "✓ done today — again?" : "Did it ✓"}
                    </button>
                  ) : (
                    <>
                      {/* Info only — controls live in the transport bar below,
                          so nothing in the list ever moves under a thumb. */}
                      <div className="text-center">
                        <div className="font-mono text-6xl font-light tabular-nums">{running ? "0:37" : "0:00"}</div>
                        {ex.tools.random_key && (
                          <div className="mt-2 text-xs text-neutral-500">
                            key <span className="ml-1 font-mono text-lg text-neutral-200">F♯</span>
                            <span className="ml-2 text-neutral-600">· every 8 beats</span>
                          </div>
                        )}
                      </div>
                      {ex.targetBpm && ex.lastBpm && (
                        <div className="mt-4">
                          <div className="flex justify-between text-[10px] text-neutral-600">
                            <span>{ex.lastBpm} bpm last</span>
                            <span>target {ex.targetBpm}</span>
                          </div>
                          <div className="mt-1 h-0.5 overflow-hidden rounded bg-neutral-800">
                            <div className="h-full bg-amber-500/70" style={{ width: `${(ex.lastBpm / ex.targetBpm) * 100}%` }} />
                          </div>
                        </div>
                      )}
                      <p className="mt-3 text-[11px] text-neutral-600">{ex.lastLabel} · details ▸</p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="pt-6 text-center text-xs text-neutral-700">+ add exercise</p>

      {/* C's transport bar, slimmed: appears only while a timed exercise is
          open; same controls in the same place for every exercise. */}
      {barVisible && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2.5">
            <button
              onClick={() => setRunning((r) => !r)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-950"
              }`}
            >
              {running ? "Stop" : "Start"}
            </button>
            <button className="text-xs text-neutral-500 hover:text-neutral-200">Log</button>
            <span className="h-5 w-px bg-neutral-800" />
            {open?.tools.metronome && (
              <>
                <button
                  onClick={() => setMetroOn((m) => !m)}
                  className={`text-xs ${metroOn ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"}`}
                >
                  ◆
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setBpm((b) => b - 2)} className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-400">−</button>
                  <span className="font-mono text-sm tabular-nums">{bpm}</span>
                  <button onClick={() => setBpm((b) => b + 2)} className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-400">+</button>
                </div>
              </>
            )}
            <button
              onClick={() => setDrone((d) => !d)}
              className={`text-xs ${drone ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"}`}
            >
              ∿
            </button>
            {drone && <input type="range" className="w-12 accent-amber-500" aria-label="drone volume" />}
            <span className="ml-auto" />
            <button className="text-xs text-neutral-600 hover:text-neutral-300">advanced ▾</button>
          </div>
        </div>
      )}
    </main>
  );
}
