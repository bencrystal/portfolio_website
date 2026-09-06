"use client";

// Attempt C — "Console": a workbench. Queue rail left (grouped by
// instrument), workspace right, and every sound tool unified into one fixed
// transport bar at the bottom — nothing floats in headers or cards.

import { useState } from "react";
import { MOCK_EXERCISES, MOCK_STATS, type MockEx } from "./mock";

export default function AttemptC() {
  const [selId, setSelId] = useState("caged");
  const [running, setRunning] = useState(false);
  const [bpm, setBpm] = useState(76);
  const [metroOn, setMetroOn] = useState(false);
  const [drone, setDrone] = useState(false);

  const ex = MOCK_EXERCISES.find((e) => e.id === selId)!;
  const groups = new Map<string, MockEx[]>();
  for (const e of MOCK_EXERCISES) {
    const k = e.instrument ?? "other";
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-neutral-950 px-4 pb-28 text-neutral-100 lg:px-8">
      <header className="flex items-baseline justify-between py-6">
        <h1 className="text-sm font-medium tracking-wide text-neutral-300">practice</h1>
        <nav className="flex gap-4 text-xs text-neutral-600">
          <span className="cursor-pointer hover:text-neutral-300">syllabus</span>
          <span className="cursor-pointer hover:text-neutral-300">edit</span>
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* Queue rail: mobile = horizontal scroll, desktop = grouped column. */}
        <aside>
          <p className="mb-2 text-xs text-neutral-600">
            {MOCK_STATS.doneCount}/{MOCK_EXERCISES.length} today ·{" "}
            <span className="text-amber-500">{MOCK_STATS.streak}-day streak</span>
          </p>
          <div className="flex gap-2 overflow-x-auto lg:block lg:space-y-4 lg:overflow-visible">
            {Array.from(groups).map(([inst, list]) => (
              <div key={inst} className="shrink-0">
                <p className="mb-1 hidden text-[10px] uppercase tracking-widest text-neutral-700 lg:block">{inst}</p>
                <ul className="flex gap-2 lg:block lg:space-y-0.5">
                  {list.map((e) => (
                    <li key={e.id} className="shrink-0">
                      <button
                        onClick={() => setSelId(e.id)}
                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                          e.id === selId
                            ? "bg-neutral-800 text-neutral-100"
                            : e.doneToday
                              ? "text-neutral-600 hover:bg-neutral-900"
                              : "text-neutral-400 hover:bg-neutral-900"
                        }`}
                      >
                        <span className={`text-xs ${e.doneToday ? "text-amber-500" : "text-neutral-700"}`}>✓</span>
                        <span className="truncate whitespace-nowrap lg:whitespace-normal">{e.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Workspace: everything about the selected exercise, and only that. */}
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">{ex.name}</h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                {ex.instrument ?? "any"} · {ex.lastLabel}
              </p>
            </div>
            {ex.tools.random_key && (
              <button className="rounded-lg bg-neutral-800 px-3 py-2 text-center hover:bg-neutral-700">
                <span className="block font-mono text-xl leading-none">F♯</span>
                <span className="text-[9px] uppercase tracking-widest text-neutral-500">key</span>
              </button>
            )}
          </div>

          {ex.desc && <p className="mt-4 max-w-md text-sm text-neutral-400">{ex.desc}</p>}

          {ex.tools.check_off ? (
            <button className="mt-8 rounded-lg border border-amber-500/60 px-8 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/10">
              {ex.doneToday ? "✓ done today — again?" : "Did it ✓"}
            </button>
          ) : (
            <div className="mt-8 flex items-end gap-6">
              <div className="font-mono text-6xl font-light tabular-nums">{running ? "0:37" : "0:00"}</div>
              {ex.targetBpm && ex.lastBpm && (
                <div className="mb-2 flex-1">
                  <div className="flex justify-between text-[10px] text-neutral-600">
                    <span>{ex.lastBpm} bpm best</span>
                    <span>target {ex.targetBpm}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded bg-neutral-800">
                    <div className="h-full bg-amber-500/70" style={{ width: `${(ex.lastBpm / ex.targetBpm) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Week strip replaces the whole Progress card. */}
          <div className="mt-8 flex items-center gap-1.5">
            {"SMTWTFS".split("").map((d, i) => (
              <span
                key={i}
                className={`grid h-6 w-6 place-items-center rounded text-[10px] ${
                  i < 5 ? "bg-amber-500/20 text-amber-400" : i === 5 ? "bg-neutral-800 text-neutral-500" : "text-neutral-700"
                }`}
              >
                {d}
              </span>
            ))}
            <span className="ml-2 text-[11px] text-neutral-600">history ▸</span>
          </div>
        </section>
      </div>

      {/* Transport bar: THE control surface. Start, then every sound tool in
          one row — always in the same place, on every exercise. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 lg:gap-5 lg:px-8">
          <button
            onClick={() => setRunning((r) => !r)}
            disabled={ex.tools.check_off}
            className={`rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-30 ${
              running ? "bg-amber-500 text-neutral-950" : "bg-neutral-100 text-neutral-950"
            }`}
          >
            {running ? "■ Stop" : "▶ Start"}
          </button>
          <button className="text-xs text-neutral-500 hover:text-neutral-200">Log</button>
          <span className="h-6 w-px bg-neutral-800" />
          <button
            onClick={() => setMetroOn((m) => !m)}
            className={`text-xs ${metroOn ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"}`}
          >
            ◆ click
          </button>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setBpm((b) => b - 2)} className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-400">−</button>
            <span className="font-mono text-sm tabular-nums">{bpm}</span>
            <button onClick={() => setBpm((b) => b + 2)} className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-400">+</button>
          </div>
          <span className="hidden text-xs text-neutral-600 lg:inline">4/4 · tap</span>
          <span className="h-6 w-px bg-neutral-800" />
          <button
            onClick={() => setDrone((d) => !d)}
            className={`text-xs ${drone ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200"}`}
          >
            ∿ drone
          </button>
          {drone && <input type="range" className="w-14 accent-amber-500" aria-label="drone volume" />}
          <span className="ml-auto" />
          <button className="text-xs text-neutral-500 hover:text-neutral-200">tuner</button>
        </div>
      </div>
    </main>
  );
}
