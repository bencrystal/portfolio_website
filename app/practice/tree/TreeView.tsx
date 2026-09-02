"use client";

import { useEffect, useState } from "react";

// Full-screen skill-tree takeover: five linear paths of nodes. Starting a
// node spawns a normal exercise on /practice; the gate (BPM threshold, total
// time, or self-assessment) decides when it can evolve and unlock the next
// node. Locks are advisory — any locked node offers "start anyway".
//
// Density is handled by compressing away from the frontier: done nodes and
// far-future nodes collapse to one line, only the current node (and the next
// one up) get full cards. State lives on a rail of dots down each column's
// left edge, tinted per branch.
//
// Future feature: per-node time estimates ("~10 min/day · ~3 weeks").

type TreeNode = {
  id: string;
  branch: string;
  position: number;
  parent_node_id: string | null;
  name: string;
  description: string | null;
  gate_type: "bpm" | "time" | "self";
  gate_value: number | null;
  space_id: string | null; // null = shared node, set = personal graft
};
type Progress = {
  node_id: string;
  exercise_id: string | null;
  status: "active" | "evolved";
  started_at: string;
  evolved_at: string | null;
};
type Session = { exercise_id: string; bpm: number | null; seconds: number | null };

const TOKEN_KEY = "practice_token";

// Single-color stroke icons (Lucide paths) so the branches read as a set
// rather than a grab-bag of emoji.
function Icon({ paths, circles, className }: { paths: string[]; circles?: [number, number, number][]; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      aria-hidden
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
      {circles?.map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} />
      ))}
    </svg>
  );
}

const ICONS: Record<string, { paths: string[]; circles?: [number, number, number][] }> = {
  pick: { paths: ["M12 22c-4.2-2.1-7-5.6-7-10V5.5L12 2l7 3.5V12c0 4.4-2.8 7.9-7 10"] },
  hand: {
    paths: [
      "M18 11V6a2 2 0 0 0-4 0v5",
      "M14 10V4a2 2 0 0 0-4 0v2",
      "M10 10.5V6a2 2 0 0 0-4 0v8",
      "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.98-2.75l-3.04-4.62a2 2 0 0 1 3.24-2.35L8 15",
    ],
  },
  pulse: { paths: ["M22 12h-4l-3 9L9 3l-3 9H2"] },
  book: {
    paths: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  },
  music: { paths: ["M9 18V5l12-2v13"], circles: [[6, 18, 3], [18, 16, 3]] as [number, number, number][] },
  zap: { paths: ["M13 2 3 14h7l-1 8 10-12h-7l1-8"] },
  clock: { paths: ["M12 7v5l3 2"], circles: [[12, 12, 9]] as [number, number, number][] },
};

const BRANCHES = [
  { key: "picking", label: "Picking", color: "#60a5fa", icon: ICONS.pick },
  { key: "fingerpicking", label: "Fingerpicking", color: "#a78bfa", icon: ICONS.hand },
  { key: "rhythm", label: "Rhythm & time", color: "#fb7185", icon: ICONS.pulse },
  { key: "theory", label: "Theory & fretboard", color: "#34d399", icon: ICONS.book },
  { key: "repertoire", label: "Repertoire", color: "#fbbf24", icon: ICONS.music },
];

function fmtDur(total: number) {
  const s = Math.round(total);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function GateIcon({ type }: { type: TreeNode["gate_type"] }) {
  const icon = type === "bpm" ? ICONS.zap : type === "time" ? ICONS.clock : ICONS.hand;
  return <Icon paths={icon.paths} circles={"circles" in icon ? icon.circles : undefined} className="h-3.5 w-3.5 shrink-0" />;
}

function gateShort(n: TreeNode) {
  if (n.gate_type === "bpm") return `${n.gate_value} bpm`;
  if (n.gate_type === "time") return `${fmtDur(n.gate_value ?? 0)} practiced`;
  return "you decide when";
}

export default function TreeView() {
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // node id mid-request
  const [preview, setPreview] = useState<string | null>(null); // compressed node peeked open

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  async function fetchAll() {
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    const [trR, seR] = await Promise.all([fetch(`/api/practice/tree${q}`), fetch(`/api/practice/sessions${q}`)]);
    const [tr, se] = await Promise.all([trR.json(), seR.json()]);
    if (tr.error || se.error) throw new Error(tr.error ?? se.error);
    setNodes(tr.nodes);
    setProgress(tr.progress);
    setSessions(se.sessions);
  }

  useEffect(() => {
    void fetchAll().catch((e) => setError(String(e.message ?? e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function api(method: string, body: unknown) {
    if (!token) {
      setError("Log in on the practice page first — your password is your identity here too.");
      return null;
    }
    const res = await fetch(`/api/practice/tree?token=${encodeURIComponent(token)}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Request failed");
      return null;
    }
    return json;
  }

  async function startNode(n: TreeNode) {
    setBusy(n.id);
    const json = await api("POST", { node_id: n.id });
    if (json) setProgress((p) => [...p, json.progress]);
    setBusy(null);
  }

  async function setStatus(n: TreeNode, status: "evolved" | "active") {
    setBusy(n.id);
    const json = await api("PATCH", { node_id: n.id, status });
    if (json) setProgress((p) => p.map((x) => (x.node_id === n.id ? json.progress : x)));
    setBusy(null);
  }

  async function addNode(branch: string) {
    const name = prompt("Name your exercise");
    if (!name?.trim()) return;
    const bpmText = prompt("Target BPM to evolve (empty = self-assessed)", "");
    if (bpmText === null) return;
    const bpm = Number(bpmText);
    const json = await api("POST", {
      action: "add",
      branch,
      name,
      gate_type: bpmText.trim() && bpm > 0 ? "bpm" : "self",
      gate_value: bpmText.trim() && bpm > 0 ? bpm : null,
    });
    if (json) setNodes((ns) => [...(ns ?? []), json.node]);
  }

  // Stats per linked exercise: best BPM ever, total time.
  const statsFor = (exId: string | null) => {
    let best = 0;
    let secs = 0;
    if (exId) {
      for (const s of sessions) {
        if (s.exercise_id !== exId) continue;
        best = Math.max(best, s.bpm ?? 0);
        secs += s.seconds ?? 0;
      }
    }
    return { best, secs };
  };

  const progByNode = new Map(progress.map((p) => [p.node_id, p]));

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-4 text-neutral-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Skill tree</h1>
          <a
            className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:border-neutral-500"
            href="/practice"
          >
            ✕ close
          </a>
        </div>
        <p className="mb-4 text-xs text-neutral-500">
          Pick 1–2 per branch. Starting a node adds it to your exercises; hit its gate and it evolves, unlocking the
          next one.
        </p>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
            {error}
            <button className="ml-3 underline" onClick={() => setError(null)}>
              dismiss
            </button>
          </div>
        )}

        {nodes === null ? (
          <p className="py-16 text-center text-sm text-neutral-500">Loading…</p>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-8">
            {BRANCHES.map((b) => {
              const branchNodes = nodes
                .filter((n) => n.branch === b.key)
                .sort((a, z) => a.position - z.position);
              const activeCount = branchNodes.filter((n) => progByNode.get(n.id)?.status === "active").length;
              const evolvedCount = branchNodes.filter((n) => progByNode.get(n.id)?.status === "evolved").length;

              // Compress away from the frontier: done and far-future nodes
              // collapse to a line, the current node gets the full card, the
              // one after it gets a title + gate.
              let cardEmitted = false;
              let nextEmitted = false;
              const rows = branchNodes.map((n, i) => {
                const prog = progByNode.get(n.id);
                const prevProg = i > 0 ? progByNode.get(branchNodes[i - 1].id) : null;
                const locked = !prog && !n.space_id && i > 0 && prevProg?.status !== "evolved";
                let tier: "done" | "card" | "next" | "pill";
                if (prog?.status === "evolved") tier = "done";
                else if (prog) {
                  tier = "card";
                  cardEmitted = true;
                } else if (!cardEmitted && !locked) {
                  tier = "card";
                  cardEmitted = true;
                } else if (!nextEmitted) {
                  tier = "next";
                  nextEmitted = true;
                } else tier = "pill";
                return { n, prog, locked, tier };
              });

              return (
                <div key={b.key} className="w-60 shrink-0 lg:flex-1">
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-neutral-200">
                    <span style={{ color: b.color }}>
                      <Icon paths={b.icon.paths} circles={"circles" in b.icon ? b.icon.circles : undefined} />
                    </span>
                    {b.label}
                    <span className="ml-auto font-mono text-xs text-neutral-500">
                      {evolvedCount} / {branchNodes.length}
                    </span>
                  </h2>
                  <p className="mb-2 h-4 text-[10px] text-amber-400/80">
                    {activeCount > 2 ? `${activeCount} active — consider focusing on 1–2` : ""}
                  </p>

                  {/* Rail of dots down the left; the line carries the branch hue. */}
                  <div className="relative">
                    <div
                      className="absolute bottom-2 left-[7px] top-2 w-px"
                      style={{ background: `${b.color}30` }}
                    />
                    {rows.map(({ n, prog, locked, tier }) => {
                      const { best, secs } = statsFor(prog?.exercise_id ?? null);
                      // Compressed rows peek open on hover (or tap, where
                      // there's no hover) to preview what's coming.
                      const previewed = preview === n.id;
                      const peekHandlers = {
                        onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && setPreview(n.id),
                        onPointerLeave: (e: React.PointerEvent) => e.pointerType === "mouse" && setPreview(null),
                        onPointerUp: (e: React.PointerEvent) =>
                          e.pointerType !== "mouse" && setPreview(previewed ? null : n.id),
                      };
                      const met =
                        n.gate_type === "bpm"
                          ? best >= (n.gate_value ?? Infinity)
                          : n.gate_type === "time"
                            ? secs >= (n.gate_value ?? Infinity)
                            : true;
                      const ready = !!prog && prog.status !== "evolved" && met;
                      const gateNum =
                        n.gate_type === "bpm"
                          ? { cur: best, max: n.gate_value ?? 0, label: `${best} / ${n.gate_value}` }
                          : n.gate_type === "time"
                            ? { cur: secs, max: n.gate_value ?? 0, label: `${fmtDur(secs)} / ${fmtDur(n.gate_value ?? 0)}` }
                            : null;

                      // Dot: filled = done, ring = current card, hollow = next, speck = far.
                      const dot =
                        tier === "done" ? (
                          <span
                            className="absolute left-[2px] top-1 h-3 w-3 rounded-full"
                            style={{ background: b.color }}
                          />
                        ) : tier === "card" ? (
                          <span
                            className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-neutral-950"
                            style={{ borderColor: b.color }}
                          />
                        ) : tier === "next" ? (
                          <span className="absolute left-[2px] top-1 h-3 w-3 rounded-full border border-neutral-600 bg-neutral-950" />
                        ) : (
                          <span className="absolute left-[5px] top-2 h-1.5 w-1.5 rounded-full bg-neutral-700" />
                        );

                      return (
                        <div key={n.id} className="relative pb-4 pl-7">
                          {dot}

                          {tier === "done" && (
                            <div className="text-sm">
                              <span className="text-neutral-300">{n.name}</span>
                              <p className="text-xs text-neutral-500">
                                {n.gate_type === "bpm" && best > 0
                                  ? `cleared at ${best} bpm`
                                  : n.gate_type === "time"
                                    ? `${fmtDur(secs)} practiced`
                                    : "cleared"}
                                <button
                                  className="ml-2 text-neutral-700 underline hover:text-neutral-400"
                                  disabled={busy === n.id}
                                  onClick={() => setStatus(n, "active")}
                                >
                                  undo
                                </button>
                              </p>
                            </div>
                          )}

                          {tier === "card" && (
                            <div
                              className="rounded-lg border bg-neutral-900/40 p-3"
                              style={{ borderColor: prog ? b.color : "#404040" }}
                            >
                              <p className="text-xs" style={{ color: prog ? b.color : "#737373" }}>
                                {prog ? "in progress" : "not started"}
                              </p>
                              <p className="mt-0.5 text-sm font-medium">{n.name}</p>
                              {n.description && <p className="mt-1 text-xs text-neutral-400">{n.description}</p>}
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                                <GateIcon type={n.gate_type} />
                                {prog && gateNum ? (
                                  <>
                                    <span>{n.gate_type === "bpm" ? "clean tempo" : "practiced"}</span>
                                    <span className="ml-auto font-mono tabular-nums text-neutral-200">
                                      {gateNum.label}
                                    </span>
                                  </>
                                ) : (
                                  <span>{gateShort(n)}</span>
                                )}
                                {!prog && (
                                  <button
                                    className="ml-auto rounded bg-neutral-100 px-2.5 py-1 font-semibold text-neutral-950 hover:bg-white disabled:opacity-50"
                                    disabled={busy === n.id}
                                    onClick={() => startNode(n)}
                                  >
                                    start
                                  </button>
                                )}
                                {ready && (
                                  <button
                                    className={`rounded px-2.5 py-1 font-semibold text-neutral-950 disabled:opacity-50 ${gateNum ? "" : "ml-auto"}`}
                                    style={{ background: b.color }}
                                    disabled={busy === n.id}
                                    onClick={() => setStatus(n, "evolved")}
                                  >
                                    {n.gate_type === "self" ? "mark evolved" : "evolve ✦"}
                                  </button>
                                )}
                              </div>
                              {prog && gateNum && gateNum.max > 0 && (
                                <div className="mt-1.5 h-1 rounded bg-neutral-800">
                                  <div
                                    className="h-1 rounded"
                                    style={{
                                      background: b.color,
                                      width: `${Math.min(100, (gateNum.cur / gateNum.max) * 100)}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {tier === "next" && (
                            <div className="text-sm" {...peekHandlers}>
                              <span className="text-neutral-300">{n.name}</span>
                              {previewed && n.description && (
                                <p className="mt-0.5 text-xs text-neutral-500">{n.description}</p>
                              )}
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                                <GateIcon type={n.gate_type} />
                                {gateShort(n)}
                                <span>·</span>
                                <button
                                  className="underline hover:text-neutral-300"
                                  disabled={busy === n.id}
                                  onClick={() => startNode(n)}
                                >
                                  {locked ? "start anyway" : "start"}
                                </button>
                              </p>
                            </div>
                          )}

                          {tier === "pill" && (
                            <div className="cursor-default pt-0.5 text-sm" {...peekHandlers}>
                              <p className={previewed ? "text-neutral-300" : "text-neutral-600"}>{n.name}</p>
                              {previewed && (
                                <>
                                  {n.description && (
                                    <p className="mt-0.5 text-xs text-neutral-500">{n.description}</p>
                                  )}
                                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
                                    <GateIcon type={n.gate_type} />
                                    {gateShort(n)}
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="mt-1 w-full rounded-lg border border-dashed border-neutral-800 py-1.5 text-xs text-neutral-600 hover:border-neutral-600 hover:text-neutral-400"
                    onClick={() => addNode(b.key)}
                  >
                    + add your own
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
