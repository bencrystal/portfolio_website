"use client";

// Attempt D — "Hybrid", pass 2: A's checklist with everything embedded in
// the card (no bottom bar). Hierarchy is controls-first: Start/Log, bpm,
// key, drone are what you touch; the timer and target progress are ambient
// status, not the centerpiece. Logging sinks the row below the rest.

import { useState } from "react";
import { MOCK_EXERCISES, MOCK_STATS } from "./mock";

export default function AttemptD() {
  const [openId, setOpenId] = useState<string | null>("caged");
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(76);
  const [drone, setDrone] = useState(false);
  // Done state is local so logging can be felt: row collapses, then lands
  // below the remaining exercises.
  const [doneIds, setDoneIds] = useState<Set<string>>(
    new Set(MOCK_EXERCISES.filter((e) => e.doneToday).map((e) => e.id))
  );
  const [sinkingId, setSinkingId] = useState<string | null>(null);

  function completeEx(id: string) {
    setRunning(false);
    setOpenId(null);
    setSinkingId(id);
    setTimeout(() => {
      setDoneIds((s) => new Set(s).add(id));
      setSinkingId(null);
    }, 380);
  }

  // Auto-sink: unfinished first, done after — saved order within each group.
  const ordered = [
    ...MOCK_EXERCISES.filter((e) => !doneIds.has(e.id)),
    ...MOCK_EXERCISES.filter((e) => doneIds.has(e.id)),
  ];

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-neutral-950 px-5 pb-16 text-neutral-100">
      <header className="flex items-baseline justify-between pb-2 pt-8">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">practice</h1>
        <nav className="flex gap-4 text-xs text-neutral-600">
          <span className="cursor-pointer hover:text-neutral-300">syllabus</span>
          <span className="cursor-pointer hover:text-neutral-300">history</span>
          <span className="cursor-pointer hover:text-neutral-300">edit</span>
        </nav>
      </header>

      {/* Queue dots + quiet stats. */}
      <div className="flex items-center justify-between pb-6">
        <div className="flex gap-1.5">
          {ordered.map((e) => (
            <button
              key={e.id}
              onClick={() => setOpenId(e.id)}
              aria-label={e.name}
              className={`h-1.5 rounded-full transition-all ${
                e.id === openId ? "w-6 bg-neutral-100" : doneIds.has(e.id) ? "w-1.5 bg-amber-500" : "w-1.5 bg-neutral-700"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          {MOCK_STATS.todayMin} min · <span className="text-amber-500">{MOCK_STATS.streak}-day streak</span>
        </p>
      </div>

      <ul className="divide-y divide-neutral-900">
        {ordered.map((ex) => {
          const isOpen = openId === ex.id;
          const done = doneIds.has(ex.id);
          const sinking = sinkingId === ex.id;
          return (
            <li
              key={ex.id}
              className={`overflow-hidden transition-all duration-300 ${
                sinking ? "max-h-0 opacity-0" : "max-h-[30rem] opacity-100"
              }`}
            >
              <button
                className="flex w-full items-center gap-3 py-3.5 text-left"
                onClick={() => setOpenId(isOpen ? null : ex.id)}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                    done
                      ? "border-amber-500 bg-amber-500 text-neutral-950"
                      : isOpen
                        ? "border-amber-500 text-amber-500"
                        : "border-neutral-700 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${done && !isOpen ? "text-neutral-600" : ""}`}>
                  {ex.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {done ? ex.todayLabel ?? "✓" : ex.instrument ?? ""}
                </span>
              </button>

              {isOpen && (
                <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  {ex.desc && <p className="mb-3 text-xs text-neutral-500">{ex.desc}</p>}

                  {ex.tools.check_off ? (
                    <button
                      onClick={() => completeEx(ex.id)}
                      className="w-full rounded-lg border border-amber-500/60 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/10"
                    >
                      {done ? "✓ done today — again?" : "Did it ✓"}
                    </button>
                  ) : (
                    <>
                      {/* Tier 1 — controls you touch. */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRunning((r) => !r)}
                          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                            running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-950"
                          }`}
                        >
                          {running ? "Stop" : "Start"}
                        </button>
                        <button
                          onClick={() => completeEx(ex.id)}
                          className="rounded-lg bg-neutral-800 px-5 text-sm text-neutral-300 hover:bg-neutral-700"
                        >
                          Log
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        {ex.tools.metronome && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setBpm((b) => b - 2)} className="grid h-8 w-8 place-items-center rounded-md bg-neutral-800 text-sm text-neutral-300">−</button>
                            <button className="text-center" title="tap for tempo">
                              <span className="font-mono text-xl tabular-nums">{bpm}</span>
                              <span className="block text-[9px] uppercase tracking-widest text-neutral-600">bpm · tap</span>
                            </button>
                            <button onClick={() => setBpm((b) => b + 2)} className="grid h-8 w-8 place-items-center rounded-md bg-neutral-800 text-sm text-neutral-300">+</button>
                          </div>
                        )}
                        {ex.tools.random_key && (
                          <button className="text-center" title="tap for a new key">
                            <span className="font-mono text-xl text-neutral-200">F♯</span>
                            <span className="block text-[9px] uppercase tracking-widest text-neutral-600">key · every 8</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDrone((d) => !d)}
                          className={`text-center ${drone ? "text-amber-400" : "text-neutral-500"}`}
                        >
                          <span className="text-xl">∿</span>
                          <span className="block text-[9px] uppercase tracking-widest text-neutral-600">drone</span>
                        </button>
                        {drone && <input type="range" className="w-14 accent-amber-500" aria-label="drone volume" />}
                      </div>

                      {/* Tier 2 — ambient status: the timer runs back here,
                          it doesn't stare at you. */}
                      <div className="mt-4 border-t border-neutral-800 pt-3">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span className="flex items-center gap-1.5 font-mono tabular-nums">
                            {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />}
                            {running ? "0:37" : "0:00"}
                          </span>
                          {ex.targetBpm && ex.lastBpm && (
                            <span>
                              {ex.lastBpm} → {ex.targetBpm} bpm
                            </span>
                          )}
                        </div>
                        {ex.targetBpm && ex.lastBpm && (
                          <div className="mt-1.5 h-0.5 overflow-hidden rounded bg-neutral-800">
                            <div className="h-full bg-amber-500/50" style={{ width: `${(ex.lastBpm / ex.targetBpm) * 100}%` }} />
                          </div>
                        )}
                        <p className="mt-2 text-[11px] text-neutral-600">
                          {ex.lastLabel} · <span className="cursor-pointer hover:text-neutral-400">advanced ▾</span> ·{" "}
                          <span className="cursor-pointer hover:text-neutral-400">details ▸</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="pt-6 text-center text-xs text-neutral-700">+ add exercise</p>
    </main>
  );
}
