"use client";

import { useEffect, useState } from "react";

// Full-screen skill-tree takeover: five linear paths of nodes. Starting a
// node spawns a normal exercise on /practice; the gate (BPM threshold, total
// time, or self-assessment) decides when it can evolve and unlock the next
// node. Locks are advisory — any locked node offers "start anyway".
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

const BRANCHES = [
  { key: "picking", label: "Picking", emoji: "🎸" },
  { key: "fingerpicking", label: "Fingerpicking", emoji: "🤌" },
  { key: "rhythm", label: "Rhythm & time", emoji: "🥁" },
  { key: "theory", label: "Theory & fretboard", emoji: "🧠" },
  { key: "repertoire", label: "Repertoire", emoji: "🎵" },
];

function fmtDur(total: number) {
  const s = Math.round(total);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  return `${m}m`;
}

function gateLabel(n: TreeNode) {
  if (n.gate_type === "bpm") return `⚡ clean at ${n.gate_value} bpm`;
  if (n.gate_type === "time") return `⏱ ${fmtDur(n.gate_value ?? 0)} practiced`;
  return "✋ when it feels ready";
}

export default function TreeView() {
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // node id mid-request

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
          <h1 className="text-xl font-semibold">🌳 Skill tree</h1>
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
          <div className="flex gap-4 overflow-x-auto pb-8">
            {BRANCHES.map((b) => {
              const branchNodes = nodes
                .filter((n) => n.branch === b.key)
                .sort((a, z) => a.position - z.position);
              const activeCount = branchNodes.filter((n) => progByNode.get(n.id)?.status === "active").length;
              return (
                <div key={b.key} className="w-56 shrink-0 lg:flex-1">
                  <h2 className="mb-1 text-sm font-medium text-neutral-300">
                    {b.emoji} {b.label}
                  </h2>
                  <p className="mb-2 h-4 text-[10px] text-amber-400/80">
                    {activeCount > 2 ? `${activeCount} active — consider focusing on 1–2` : ""}
                  </p>
                  {branchNodes.map((n, i) => {
                    const prog = progByNode.get(n.id);
                    const prevProg = i > 0 ? progByNode.get(branchNodes[i - 1].id) : null;
                    // Personal grafts and started nodes are never locked; the
                    // chain otherwise opens as the previous node evolves.
                    const locked = !prog && !n.space_id && i > 0 && prevProg?.status !== "evolved";
                    const { best, secs } = statsFor(prog?.exercise_id ?? null);
                    const met =
                      n.gate_type === "bpm"
                        ? best >= (n.gate_value ?? Infinity)
                        : n.gate_type === "time"
                          ? secs >= (n.gate_value ?? Infinity)
                          : true;
                    const evolved = prog?.status === "evolved";
                    const ready = !!prog && !evolved && met;
                    return (
                      <div key={n.id}>
                        {i > 0 && (
                          <div
                            className={`mx-auto h-4 w-px ${prevProg?.status === "evolved" ? "bg-amber-500/60" : "bg-neutral-800"}`}
                          />
                        )}
                        <div
                          className={`rounded-lg border p-2.5 text-sm transition-colors ${
                            evolved
                              ? "border-amber-500/60 bg-amber-500/10"
                              : ready
                                ? "border-amber-400"
                                : prog
                                  ? "border-neutral-600"
                                  : locked
                                    ? "border-neutral-800 opacity-50"
                                    : "border-neutral-700"
                          }`}
                        >
                          <div className="font-medium">
                            {evolved && "✓ "}
                            {locked && "🔒 "}
                            {n.name}
                          </div>
                          {n.description && <p className="mt-0.5 text-xs text-neutral-500">{n.description}</p>}
                          <p className="mt-1 text-[10px] text-neutral-500">{gateLabel(n)}</p>
                          {prog && !evolved && n.gate_type !== "self" && (
                            <p className="mt-0.5 text-[10px] tabular-nums text-neutral-400">
                              {n.gate_type === "bpm" ? `best ${best} / ${n.gate_value} bpm` : `${fmtDur(secs)} / ${fmtDur(n.gate_value ?? 0)}`}
                            </p>
                          )}
                          <div className="mt-1.5">
                            {!prog && !locked && (
                              <button
                                className="rounded bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-950 hover:bg-white disabled:opacity-50"
                                disabled={busy === n.id}
                                onClick={() => startNode(n)}
                              >
                                start
                              </button>
                            )}
                            {!prog && locked && (
                              <button
                                className="text-[10px] text-neutral-500 underline hover:text-neutral-300"
                                disabled={busy === n.id}
                                onClick={() => startNode(n)}
                              >
                                start anyway
                              </button>
                            )}
                            {ready && (
                              <button
                                className="rounded bg-amber-500 px-2.5 py-1 text-xs font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
                                disabled={busy === n.id}
                                onClick={() => setStatus(n, "evolved")}
                              >
                                {n.gate_type === "self" ? "mark evolved" : "evolve ✦"}
                              </button>
                            )}
                            {prog && !evolved && !ready && (
                              <span className="text-[10px] text-neutral-500">in progress</span>
                            )}
                            {evolved && (
                              <button
                                className="text-[10px] text-neutral-600 underline hover:text-neutral-400"
                                disabled={busy === n.id}
                                onClick={() => setStatus(n, "active")}
                              >
                                undo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    className="mt-3 w-full rounded-lg border border-dashed border-neutral-800 py-1.5 text-xs text-neutral-600 hover:border-neutral-600 hover:text-neutral-400"
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
