"use client";

// Attempt A — "Today": the page is the day's checklist. Tapping a row expands
// it in place into the live session; nothing else competes for attention.

import { useState } from "react";
import { MOCK_EXERCISES, MOCK_STATS } from "./mock";

export default function AttemptA() {
  const [openId, setOpenId] = useState<string | null>("caged");
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(76);

  const done = MOCK_EXERCISES.filter((e) => e.doneToday).length;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-neutral-950 px-5 pb-24 text-neutral-100">
      {/* Header: identity + the only three ways out of today. */}
      <header className="flex items-baseline justify-between pb-2 pt-8">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">practice</h1>
        <nav className="flex gap-4 text-xs text-neutral-600">
          <span className="cursor-pointer hover:text-neutral-300">syllabus</span>
          <span className="cursor-pointer hover:text-neutral-300">history</span>
          <span className="cursor-pointer hover:text-neutral-300">edit</span>
        </nav>
      </header>

      {/* One quiet status line instead of a stats footer + progress card. */}
      <p className="pb-6 text-xs text-neutral-500">
        {done} of {MOCK_EXERCISES.length} today · {MOCK_STATS.todayMin} min ·{" "}
        <span className="text-amber-500">{MOCK_STATS.streak}-day streak</span>
      </p>

      <ul className="divide-y divide-neutral-900">
        {MOCK_EXERCISES.map((ex) => {
          const open = openId === ex.id;
          return (
            <li key={ex.id}>
              {/* Row: status dot · name · meta. The whole row is the toggle. */}
              <button
                className="flex w-full items-center gap-3 py-3.5 text-left"
                onClick={() => setOpenId(open ? null : ex.id)}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] ${
                    ex.doneToday
                      ? "border-amber-500 bg-amber-500 text-neutral-950"
                      : open
                        ? "border-amber-500 text-amber-500"
                        : "border-neutral-700 text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${ex.doneToday && !open ? "text-neutral-600" : ""}`}>
                  {ex.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-600">
                  {ex.doneToday ? ex.todayLabel : ex.instrument ?? ""}
                </span>
              </button>

              {/* Expanded: the session lives inside the list, not above it. */}
              {open && (
                <div className="mb-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
                  {ex.desc && <p className="mb-3 text-xs text-neutral-500">{ex.desc}</p>}

                  {ex.tools.check_off ? (
                    <button className="w-full rounded-lg border border-amber-500/60 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/10">
                      Did it ✓
                    </button>
                  ) : (
                    <>
                      <div className="flex items-end justify-between">
                        <div className="font-mono text-4xl tabular-nums">{running ? "0:37" : "0:00"}</div>
                        {ex.tools.metronome && (
                          <div className="flex items-center gap-2 pb-1">
                            <button onClick={() => setBpm((b) => b - 2)} className="rounded-md bg-neutral-800 px-2 py-1 text-xs">−2</button>
                            <span className="font-mono text-lg tabular-nums">
                              {bpm}
                              <span className="ml-1 text-[10px] text-neutral-500">bpm</span>
                            </span>
                            <button onClick={() => setBpm((b) => b + 2)} className="rounded-md bg-neutral-800 px-2 py-1 text-xs">+2</button>
                          </div>
                        )}
                      </div>
                      {ex.targetBpm && ex.lastBpm && (
                        <div className="mt-2 h-0.5 overflow-hidden rounded bg-neutral-800">
                          <div className="h-full bg-amber-500/70" style={{ width: `${(ex.lastBpm / ex.targetBpm) * 100}%` }} />
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setRunning((r) => !r)}
                          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
                            running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-950"
                          }`}
                        >
                          {running ? "Stop" : "Start"}
                        </button>
                        <button className="rounded-lg bg-neutral-800 px-4 text-sm text-neutral-300">Log</button>
                      </div>
                      {ex.tools.random_key && (
                        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                          <span>
                            key <span className="ml-1 font-mono text-base text-neutral-200">F♯</span>
                          </span>
                          <span>every 8 beats · drone off · <span className="text-neutral-400">tools ▸</span></span>
                        </div>
                      )}
                      <p className="mt-3 text-[11px] text-neutral-600">{ex.lastLabel}</p>
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
