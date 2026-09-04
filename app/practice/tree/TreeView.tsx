"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "../Reveal";
import StringUnison from "./string-unison.esm";

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
  ref_url: string | null;
  space_id: string | null; // null = shared node, set = personal graft
  tier: number | null; // 1-based; null (pre-migration rows) reads as tier 1
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
  { key: "theory", label: "Theory, fretboard & ears", color: "#34d399", icon: ICONS.book },
  { key: "repertoire", label: "Repertoire", color: "#fbbf24", icon: ICONS.music },
];

// Tier names describe what the playing feels like at each stage — no persona
// labels (amateur/pro), no video-game loot rarities.
const TIER_NAMES = ["Fundamentals", "Development", "Fluency", "Mastery"];
const tierName = (t: number | null) => TIER_NAMES[(t ?? 1) - 1] ?? `Tier ${t}`;

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

// Compressed row whose preview floats as an overlay clone above the list —
// Branch body wrapper: on desktop the children must land directly in the
// branch's subgrid (Reveal's wrapper divs would swallow the shared rows), and
// the columns are always open there anyway — the animated Reveal only serves
// the mobile accordion.
function BranchBody({ flat, open, children }: { flat: boolean; open: boolean; children: React.ReactNode }) {
  return flat ? <>{children}</> : <Reveal open={open}>{children}</Reveal>;
}

// expanding never shifts the rows below it, so hovering down a column can't
// yank the next target out from under the cursor. The clone repeats the base
// content pixel-aligned on top, then mask-reveals the extra lines.
function Peek({
  dim,
  previewed,
  handlers,
  color,
  base,
  overlayBase,
  extra,
}: {
  dim?: boolean;
  previewed: boolean;
  handlers: React.DOMAttributes<HTMLDivElement>;
  color: string; // branch accent, tints the peeked border
  base: React.ReactNode;
  overlayBase?: React.ReactNode; // un-truncated variant for the expanded clone
  extra: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* "Brewing": the border warms toward the branch hue the instant the
          pointer arrives — immediate acknowledgement while the peek itself
          waits out the hover-intent delay. */}
      <div
        className={`rounded-lg border border-wood-800/60 px-2.5 py-1.5 text-sm transition-colors duration-150 hover:border-[var(--hue)] ${dim ? "text-wood-600" : ""}`}
        style={{ "--hue": `${color}55` } as React.CSSProperties}
        {...handlers}
      >
        {base}
      </div>
      {/* Purely visual — pointer-events-none keeps the hover zone at the
          original footprint (so covered rows reappear the moment you head
          for them) and lets clicks fall through to the real row beneath.
          Opens with a slight lift (scale + shadow); on close the fade waits
          for the mask to redact, so it retracts the way it expanded. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 origin-top rounded-lg border bg-wood-900 px-2.5 py-1.5 text-sm text-wood-300 transition-[opacity,transform,box-shadow] ${
          previewed
            ? "scale-100 opacity-100 shadow-xl shadow-black/40 duration-200"
            : "scale-[0.98] opacity-0 shadow-none delay-200 duration-200"
        }`}
        style={{ borderColor: previewed ? `${color}80` : "transparent" }}
      >
        {overlayBase ?? base}
        <Reveal open={previewed}>{extra}</Reveal>
      </div>
    </div>
  );
}

export default function TreeView() {
  const [nodes, setNodes] = useState<TreeNode[] | null>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null); // node id mid-request
  const [preview, setPreview] = useState<string | null>(null); // compressed node peeked open (hover)
  const [pinned, setPinned] = useState<string | null>(null); // peek held open by click/tap
  const peekTimer = useRef(0); // hover-intent delay so sweeping past doesn't flicker peeks
  const [hintOpen, setHintOpen] = useState(false); // how-it-works line, first-visit + "?"
  const [openBranch, setOpenBranch] = useState<string | null>(null); // mobile accordion
  const [wide, setWide] = useState(false); // lg+: all branches always open, side by side
  const [exArchived, setExArchived] = useState<Map<string, boolean>>(new Map()); // linked exercise paused?
  const [demo, setDemo] = useState(false); // ?demo — dev bar to preview celebrations
  const [demoTier, setDemoTier] = useState(1);

  useEffect(() => {
    // Same first-visit-hint pattern as the main page: shown once, then
    // tucked behind the "?" so the header isn't permanent explainer noise.
    setHintOpen(localStorage.getItem("practice_tree_hint") !== "1");
    setDemo(new URLSearchParams(location.search).has("demo"));
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  async function fetchAll() {
    const q = token ? `?token=${encodeURIComponent(token)}` : "";
    const [trR, seR, exR] = await Promise.all([
      fetch(`/api/practice/tree${q}`),
      fetch(`/api/practice/sessions${q}`),
      fetch(`/api/practice/exercises${q}`),
    ]);
    const [tr, se, ex] = await Promise.all([trR.json(), seR.json(), exR.json()]);
    if (tr.error || se.error || ex.error) throw new Error(tr.error ?? se.error ?? ex.error);
    setNodes(tr.nodes);
    setProgress(tr.progress);
    setSessions(se.sessions);
    setExArchived(
      new Map((ex.exercises as { id: string; archived: boolean }[]).map((e) => [e.id, !!e.archived]))
    );
    // Mobile accordion opens on the branch you're mid-way through.
    const activeProg = (tr.progress as Progress[]).find((p) => p.status === "active");
    const activeNode = (tr.nodes as TreeNode[]).find((n) => n.id === activeProg?.node_id);
    setOpenBranch(activeNode?.branch ?? BRANCHES[0].key);
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
    if (json) {
      const next = progress.map((x) => (x.node_id === n.id ? json.progress : x));
      setProgress(next);
      if (status === "evolved") celebrateIfTierDone(n, next);
    }
    setBusy(null);
  }

  // Tier completion is the one big moment: when the last node of a branch's
  // tier evolves, the whole screen goes dark and the string-unison animation
  // plays in the branch's hue. (Sound design to come.)
  function celebrateIfTierDone(n: TreeNode, prog: Progress[]) {
    const b = BRANCHES.find((x) => x.key === n.branch);
    if (!b || !nodes) return;
    const byId = new Map(prog.map((p) => [p.node_id, p]));
    const tierNodes = nodes.filter((x) => x.branch === n.branch && (x.tier ?? 1) === (n.tier ?? 1));
    if (tierNodes.length === 0 || !tierNodes.every((x) => byId.get(x.id)?.status === "evolved")) return;
    StringUnison.play({
      accent: b.color,
      background: "#141110", // the page's wood-950 — reads as the room dimming
      label: `${b.label} — ${tierName(n.tier)} complete`,
      sublabel: "tap to continue",
    });
  }

  // Pause: archive the linked exercise so it leaves the main page, but keep
  // the tree progress — the node shows "paused" and can resume any time.
  async function togglePause(n: TreeNode, prog: Progress) {
    if (!prog.exercise_id) return;
    if (!token) {
      setError("Log in on the practice page first — your password is your identity here too.");
      return;
    }
    setBusy(n.id);
    const paused = exArchived.get(prog.exercise_id) ?? false;
    const res = await fetch(`/api/practice/exercises?token=${encodeURIComponent(token)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: prog.exercise_id, archived: !paused }),
    });
    if (res.ok) setExArchived((m) => new Map(m).set(prog.exercise_id!, !paused));
    else setError((await res.json()).error ?? "Request failed");
    setBusy(null);
  }

  // Remove: un-start the node. The exercise is archived, not deleted, so any
  // logged sessions survive.
  async function removeNode(n: TreeNode) {
    if (!confirm(`Remove “${n.name}” from your exercises? Logged sessions are kept.`)) return;
    setBusy(n.id);
    const json = await api("DELETE", { node_id: n.id });
    if (json) setProgress((p) => p.filter((x) => x.node_id !== n.id));
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
    <main className="min-h-screen bg-wood-950 px-4 py-4 text-wood-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Skill tree</h1>
          <div className="flex items-center gap-2">
            <button
              className="h-7 w-7 rounded-full border border-wood-700 text-sm text-wood-400 hover:border-wood-500"
              title="How it works"
              onClick={() => setHintOpen((h) => !h)}
            >
              ?
            </button>
            <a
              className="rounded-md border border-wood-700 px-3 py-1 text-sm text-wood-300 hover:border-wood-500"
              href="/practice"
            >
              ✕ close
            </a>
          </div>
        </div>
        <Reveal open={hintOpen}>
          <div className="mb-4 rounded-lg border border-wood-800 bg-wood-900 px-3 py-2 text-xs text-wood-400">
            Pick 1–2 per branch. Starting a node adds it to your exercises; hit its gate and it evolves, unlocking
            the next one.
            <button
              className="ml-2 rounded border border-wood-700 px-1.5 py-0.5 text-wood-300 hover:border-wood-500"
              onClick={() => {
                setHintOpen(false);
                localStorage.setItem("practice_tree_hint", "1");
              }}
            >
              got it
            </button>
          </div>
        </Reveal>

        {error && (
          <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-3 py-2 text-sm text-red-300">
            {error}
            <button className="ml-3 underline" onClick={() => setError(null)}>
              dismiss
            </button>
          </div>
        )}

        {nodes === null ? (
          <p className="py-16 text-center text-sm text-wood-500">Loading…</p>
        ) : (
          // Desktop: five subgrid columns sharing rows, so every tier band
          // (Development, Fluency, Mastery) starts at the same height in all
          // branches. Mobile: an accordion stack — horizontal scrolling hid
          // most of the tree.
          <div className={wide ? "grid grid-cols-5 gap-x-6 pb-8" : "flex flex-col gap-3 pb-8"}>
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

              const bodyOpen = wide || openBranch === b.key;
              return (
                <div
                  key={b.key}
                  className={wide ? "grid min-w-0" : "min-w-0"}
                  // 7 shared rows: header, warning, tier ×4, add-your-own.
                  style={wide ? { gridTemplateRows: "subgrid", gridRow: "span 7" } : undefined}
                >
                  {/* Header doubles as the accordion toggle on mobile. */}
                  <button
                    className="mb-1 flex w-full items-center gap-2 py-1 text-sm font-medium text-wood-200 lg:cursor-default lg:py-0"
                    onClick={() => !wide && setOpenBranch(bodyOpen ? null : b.key)}
                  >
                    <span style={{ color: b.color }}>
                      <Icon paths={b.icon.paths} circles={"circles" in b.icon ? b.icon.circles : undefined} />
                    </span>
                    {b.label}
                    {/* Count snug against the label — right-aligned it floated
                        in space and read as unrelated. */}
                    <span className="font-mono text-xs text-wood-500">
                      {evolvedCount}/{branchNodes.length}
                    </span>
                    <span className="ml-auto text-xs text-wood-500 lg:hidden">{bodyOpen ? "▾" : "▸"}</span>
                  </button>
                  <BranchBody flat={wide} open={bodyOpen}>
                  <p className="mb-2 h-4 text-[10px] text-brass-400/80">
                    {activeCount > 2 ? `${activeCount} active — consider focusing on 1–2` : ""}
                  </p>

                  {/* One block per tier; on desktop each block sits on a shared
                      subgrid row across all five branches. */}
                  {[1, 2, 3, 4].map((t) => {
                    const group = rows.filter((r) => (r.n.tier ?? 1) === t);
                    return (
                  <div key={t}>
                  {t > 1 && group.length > 0 && (
                    <p className="mb-1.5 pl-7 text-[10px] uppercase tracking-widest" style={{ color: `${b.color}90` }}>
                      {tierName(t)}
                    </p>
                  )}
                  {/* Rail of dots down the left; the line carries the branch hue. */}
                  <div className="relative">
                    {group.length > 0 && (
                    <div
                      className="absolute bottom-2 left-[7px] top-2 w-px"
                      style={{ background: `${b.color}30` }}
                    />
                    )}
                    {group.map(({ n, prog, locked, tier }) => {
                      const { best, secs } = statsFor(prog?.exercise_id ?? null);
                      // Compressed rows peek open on hover (or tap, where
                      // there's no hover) to preview what's coming.
                      // Hover previews; click/tap pins (click again unpins), so
                      // desktop can hold a peek open too.
                      const previewed = preview === n.id || pinned === n.id;
                      const peekHandlers = {
                        onPointerEnter: (e: React.PointerEvent) => {
                          if (e.pointerType !== "mouse") return;
                          clearTimeout(peekTimer.current);
                          peekTimer.current = window.setTimeout(() => setPreview(n.id), 120);
                        },
                        onPointerLeave: (e: React.PointerEvent) => {
                          if (e.pointerType !== "mouse") return;
                          clearTimeout(peekTimer.current);
                          setPreview(null);
                        },
                        onPointerUp: (e: React.PointerEvent) => {
                          // Buttons inside the row (start etc.) shouldn't toggle the pin.
                          if ((e.target as HTMLElement).closest("button")) return;
                          setPinned((p) => (p === n.id ? null : n.id));
                        },
                      };
                      const met =
                        n.gate_type === "bpm"
                          ? best >= (n.gate_value ?? Infinity)
                          : n.gate_type === "time"
                            ? secs >= (n.gate_value ?? Infinity)
                            : true;
                      const ready = !!prog && prog.status !== "evolved" && met;
                      const paused = !!prog?.exercise_id && (exArchived.get(prog.exercise_id) ?? false);
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
                            className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 bg-wood-950"
                            style={{ borderColor: b.color }}
                          />
                        ) : tier === "next" ? (
                          <span className="absolute left-[2px] top-2 h-3 w-3 rounded-full border border-wood-600 bg-wood-950" />
                        ) : (
                          <span className="absolute left-[5px] top-3 h-1.5 w-1.5 rounded-full bg-wood-700" />
                        );

                      return (
                        <div key={n.id} className="relative pb-4 pl-7">
                          {dot}

                          {tier === "done" && (
                            <div className="text-sm">
                              <span className="text-wood-300">{n.name}</span>
                              <p className="text-xs text-wood-500">
                                {n.gate_type === "bpm" && best > 0
                                  ? `cleared at ${best} bpm`
                                  : n.gate_type === "time"
                                    ? `${fmtDur(secs)} practiced`
                                    : "cleared"}
                                <button
                                  className="ml-2 text-wood-700 underline hover:text-wood-400"
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
                              className="rounded-lg border bg-wood-900/40 p-3 lg:flex lg:min-h-[11rem] lg:flex-col"
                              style={{ borderColor: prog && !paused ? b.color : "#453d35" }}
                            >
                              <div className="flex items-start justify-between gap-2 text-xs">
                                <span style={{ color: prog && !paused ? b.color : "#857b70" }}>
                                  {prog ? (paused ? "paused" : "in progress") : "not started"}
                                </span>
                                {prog && (
                                  <span className="flex gap-2 text-[10px] text-wood-600">
                                    <button
                                      className="hover:text-wood-300"
                                      disabled={busy === n.id}
                                      onClick={() => togglePause(n, prog)}
                                    >
                                      {paused ? "resume" : "pause"}
                                    </button>
                                    <button
                                      className="hover:text-red-400"
                                      disabled={busy === n.id}
                                      onClick={() => removeNode(n)}
                                    >
                                      remove
                                    </button>
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-sm font-medium">{n.name}</p>
                              {n.description && <p className="mt-1 text-xs text-wood-400">{n.description}</p>}
                              {n.ref_url && (
                                <a
                                  href={n.ref_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-block text-[11px] text-wood-500 underline hover:text-wood-300"
                                >
                                  🔗 lesson / reference
                                </a>
                              )}
                              {/* Gate + actions pinned to the bottom so the five
                                  frontier cards line up across branches. */}
                              <div className="lg:mt-auto">
                              <div className="mt-2 flex items-center gap-1.5 text-xs text-wood-400">
                                <GateIcon type={n.gate_type} />
                                {prog && gateNum ? (
                                  <>
                                    <span>{n.gate_type === "bpm" ? "clean tempo" : "practiced"}</span>
                                    <span className="ml-auto font-mono tabular-nums text-wood-200">
                                      {gateNum.label}
                                    </span>
                                  </>
                                ) : (
                                  <span>{gateShort(n)}</span>
                                )}
                                {!prog && (
                                  <button
                                    className="ml-auto rounded bg-wood-100 px-2.5 py-1 font-semibold text-wood-950 hover:bg-white disabled:opacity-50"
                                    disabled={busy === n.id}
                                    onClick={() => startNode(n)}
                                  >
                                    start
                                  </button>
                                )}
                                {ready && (
                                  <button
                                    className={`rounded px-2.5 py-1 font-semibold text-wood-950 disabled:opacity-50 ${gateNum ? "" : "ml-auto"}`}
                                    style={{ background: b.color }}
                                    disabled={busy === n.id}
                                    onClick={() => setStatus(n, "evolved")}
                                  >
                                    {n.gate_type === "self" ? "mark evolved" : "evolve ✦"}
                                  </button>
                                )}
                              </div>
                              {prog && gateNum && gateNum.max > 0 && (
                                <div className="mt-1.5 h-1 rounded bg-wood-800">
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
                            </div>
                          )}

                          {tier === "next" && (
                            <Peek
                              previewed={previewed}
                              handlers={peekHandlers}
                              color={b.color}
                              base={
                                <>
                                  <span className="text-wood-300">{n.name}</span>
                                  {/* Gate and action wrap as whole units — the long
                                      self-gate text was colliding with the link. */}
                                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-wood-500">
                                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                                      <GateIcon type={n.gate_type} />
                                      {gateShort(n)}
                                    </span>
                                    <button
                                      className="whitespace-nowrap underline hover:text-wood-300"
                                      disabled={busy === n.id}
                                      onClick={() => startNode(n)}
                                    >
                                      {locked ? "start anyway" : "start"}
                                    </button>
                                  </p>
                                </>
                              }
                              extra={
                                n.description ? (
                                  <p className="mt-0.5 text-xs text-wood-500">{n.description}</p>
                                ) : null
                              }
                            />
                          )}

                          {tier === "pill" && (
                            <Peek
                              dim
                              previewed={previewed}
                              handlers={peekHandlers}
                              color={b.color}
                              base={<p className="truncate">{n.name}</p>}
                              overlayBase={<p>{n.name}</p>}
                              extra={
                                <>
                                  {n.description && (
                                    <p className="mt-0.5 text-xs text-wood-500">{n.description}</p>
                                  )}
                                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wood-500">
                                    <GateIcon type={n.gate_type} />
                                    {gateShort(n)}
                                  </p>
                                </>
                              }
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </div>
                    );
                  })}

                  <button
                    className="mt-1 w-full rounded-lg border border-dashed border-wood-800 py-1.5 text-xs text-wood-600 hover:border-wood-600 hover:text-wood-400"
                    onClick={() => addNode(b.key)}
                  >
                    + add your own
                  </button>
                  </BranchBody>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dev bar (visit /practice/tree?demo): preview the tier celebration
          for any branch/tier without having to actually clear one. */}
      {demo && (
        <div className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-wood-700 bg-wood-900/95 px-3.5 py-1.5 text-xs">
          <span className="text-wood-500">celebrate:</span>
          {BRANCHES.map((b) => (
            <button
              key={b.key}
              className="hover:underline"
              style={{ color: b.color }}
              onClick={() =>
                StringUnison.play({
                  accent: b.color,
                  background: "#141110",
                  label: `${b.label} — ${tierName(demoTier)} complete`,
                  sublabel: "tap to continue",
                })
              }
            >
              {b.label.split(" ")[0].toLowerCase()}
            </button>
          ))}
          <select
            className="rounded border border-wood-700 bg-wood-900 px-1 py-0.5 text-[10px] text-wood-400"
            value={demoTier}
            onChange={(e) => setDemoTier(Number(e.target.value))}
            aria-label="tier"
          >
            {TIER_NAMES.map((t, i) => (
              <option key={t} value={i + 1}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </main>
  );
}
