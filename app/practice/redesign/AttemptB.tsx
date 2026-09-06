"use client";

// Attempt B — "Player": one exercise at a time, full screen, like a music
// player. Prev/next walk the queue; the whole list is a pull-up drawer.

import { useState } from "react";
import { MOCK_EXERCISES, MOCK_STATS } from "./mock";

export default function AttemptB() {
  const [idx, setIdx] = useState(2); // CAGED arpeggios
  const [running, setRunning] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [bpm, setBpm] = useState(76);
  const [drone, setDrone] = useState(false);

  const ex = MOCK_EXERCISES[idx];
  const n = MOCK_EXERCISES.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-950 px-6 text-neutral-100">
      <header className="flex items-center justify-between pt-6 text-xs text-neutral-600">
        <span className="text-neutral-500">practice</span>
        <span>
          {MOCK_STATS.todayMin} min · <span className="text-amber-500">{MOCK_STATS.streak}🔥</span>
        </span>
      </header>

      {/* Queue position as dots — done exercises fill in amber. */}
      <div className="flex justify-center gap-1.5 pt-8">
        {MOCK_EXERCISES.map((e, i) => (
          <button
            key={e.id}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-neutral-100" : e.doneToday ? "w-1.5 bg-amber-500" : "w-1.5 bg-neutral-700"
            }`}
            aria-label={e.name}
          />
        ))}
      </div>

      {/* The one thing. */}
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        {ex.instrument && (
          <span className="mb-2 text-[10px] uppercase tracking-widest text-neutral-600">{ex.instrument}</span>
        )}
        <h1 className="max-w-[16rem] text-xl font-medium leading-snug">{ex.name}</h1>
        <p className="mt-1 text-xs text-neutral-600">{ex.lastLabel}</p>

        {ex.tools.check_off ? (
          <button className="mt-10 rounded-full border border-amber-500/60 px-10 py-4 text-base font-semibold text-amber-400 hover:bg-amber-500/10">
            {ex.doneToday ? "✓ done — again?" : "Did it ✓"}
          </button>
        ) : (
          <>
            <div className="mt-8 font-mono text-7xl font-light tabular-nums">{running ? "0:37" : "0:00"}</div>
            {ex.tools.metronome && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <button onClick={() => setBpm((b) => b - 2)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-neutral-400">−</button>
                <span className="font-mono text-2xl tabular-nums">
                  {bpm}
                  <span className="ml-1 text-xs text-neutral-500">bpm</span>
                </span>
                <button onClick={() => setBpm((b) => b + 2)} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-900 text-neutral-400">+</button>
              </div>
            )}
            <button
              onClick={() => setRunning((r) => !r)}
              className={`mt-8 rounded-full px-12 py-4 text-base font-semibold ${
                running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-950"
              }`}
            >
              {running ? "Stop" : "Start"}
            </button>
            {running && <button className="mt-3 text-xs text-neutral-500 underline-offset-2 hover:underline">log 0:37</button>}
          </>
        )}

        {/* Tools shrink to a quiet icon row; only flagged ones appear. */}
        <div className="mt-10 flex gap-5 text-xs text-neutral-600">
          {ex.tools.random_key && (
            <button className="hover:text-neutral-300">
              key <span className="ml-0.5 font-mono text-sm text-neutral-300">F♯</span>
            </button>
          )}
          <button onClick={() => setDrone((d) => !d)} className={drone ? "text-amber-400" : "hover:text-neutral-300"}>
            drone
          </button>
          <button className="hover:text-neutral-300">tuner</button>
        </div>
      </section>

      {/* Prev / next + drawer handle pinned to the bottom. */}
      <footer className="pb-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setIdx((i) => (i + n - 1) % n)} className="p-3 text-neutral-500 hover:text-neutral-200">‹</button>
          <button onClick={() => setDrawer(true)} className="text-xs text-neutral-600 hover:text-neutral-300">
            queue {idx + 1} of {n} ▴
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % n)} className="p-3 text-neutral-500 hover:text-neutral-200">›</button>
        </div>
      </footer>

      {/* Queue drawer: the entire list + everything secondary. */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-neutral-950/70" onClick={() => setDrawer(false)}>
          <div
            className="rounded-t-2xl border-t border-neutral-800 bg-neutral-900 px-5 pb-8 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-700" />
            <ul className="space-y-1">
              {MOCK_EXERCISES.map((e, i) => (
                <li key={e.id}>
                  <button
                    onClick={() => { setIdx(i); setDrawer(false); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm ${
                      i === idx ? "bg-neutral-800" : "hover:bg-neutral-800/50"
                    }`}
                  >
                    <span className={e.doneToday ? "text-amber-500" : "text-neutral-700"}>✓</span>
                    <span className={`flex-1 truncate ${e.doneToday ? "text-neutral-500" : ""}`}>{e.name}</span>
                    <span className="text-xs text-neutral-600">{e.doneToday ? e.todayLabel : e.instrument ?? ""}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between text-xs text-neutral-600">
              <span className="cursor-pointer hover:text-neutral-300">+ add</span>
              <span className="cursor-pointer hover:text-neutral-300">syllabus</span>
              <span className="cursor-pointer hover:text-neutral-300">history</span>
              <span className="cursor-pointer hover:text-neutral-300">edit</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
