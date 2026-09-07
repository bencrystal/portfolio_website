"use client";

// /practice?redesign — renders the three mockup attempts with a floating
// panel to flip between them. Mock data, dead audio; deleted once a
// direction wins.

import { useState } from "react";
import AttemptA from "./AttemptA";
import AttemptB from "./AttemptB";
import AttemptC from "./AttemptC";
import AttemptD from "./AttemptD";

const ATTEMPTS = {
  a: { label: "A · Today", note: "the page is the checklist; rows expand into the session", View: AttemptA },
  b: { label: "B · Player", note: "one exercise full-screen; queue in a pull-up drawer", View: AttemptB },
  c: { label: "C · Console", note: "queue rail + workspace; all sound tools in one transport bar", View: AttemptC },
  d: { label: "D · Hybrid", note: "checklist, all-in-card, controls-first / ambient timer; done rows auto-sink", View: AttemptD },
} as const;
type Key = keyof typeof ATTEMPTS;

export default function DevPanel({ initial }: { initial?: string }) {
  const [key, setKey] = useState<Key>(initial && initial in ATTEMPTS ? (initial as Key) : "d");
  const { note, View } = ATTEMPTS[key];

  return (
    <>
      <View />
      {/* Floating switcher; sits above attempt C's bottom transport bar. */}
      <div className="fixed bottom-20 right-3 z-[60] w-44 rounded-xl border border-neutral-700 bg-neutral-900/95 p-2 text-xs shadow-lg backdrop-blur">
        <p className="mb-1.5 px-1 text-[10px] uppercase tracking-widest text-neutral-500">redesign</p>
        <div className="space-y-0.5">
          {(Object.keys(ATTEMPTS) as Key[]).map((k) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={`block w-full rounded-md px-2 py-1 text-left ${
                k === key ? "bg-amber-500/15 text-amber-400" : "text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {ATTEMPTS[k].label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 px-1 text-[10px] leading-snug text-neutral-600">{note}</p>
        <a href="/practice" className="mt-1.5 block px-1 text-[10px] text-neutral-500 hover:text-neutral-300">
          ← real page
        </a>
      </div>
    </>
  );
}
