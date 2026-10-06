"use client";

// /practice?redesign — flips between tools-page design variants. Unlike the
// log mockups these are fully LIVE (real audio, shared prefs); switching
// variants stops any running sound. Deleted once a direction wins.

import { useState } from "react";
import ToolsView from "../ToolsView";
import VariantA from "./VariantA";
import VariantB from "./VariantB";
import VariantC from "./VariantC";

const ATTEMPTS = {
  current: { label: "· current", note: "the shipped card stack", View: ToolsView },
  a: { label: "A · Dial", note: "one iconic shape — big breathing metronome dial, key coin, draining timer ring", View: VariantA },
  b: { label: "B · Deck", note: "hi-fi rack: hardware modules, LED meters, glowing mono numerals", View: VariantB },
  c: { label: "C · Poster", note: "editorial big type — the numbers are the interface, tap them to play", View: VariantC },
} as const;
type Key = keyof typeof ATTEMPTS;

export default function ToolsDevPanel({ initial }: { initial?: string }) {
  const [key, setKey] = useState<Key>(initial && initial in ATTEMPTS ? (initial as Key) : "a");
  const { note, View } = ATTEMPTS[key];

  return (
    <>
      <View key={key} />
      <div className="fixed bottom-20 right-3 z-[60] w-48 rounded-xl border border-neutral-700 bg-neutral-900/95 p-2 text-xs shadow-lg backdrop-blur">
        <p className="mb-1.5 px-1 text-[10px] uppercase tracking-widest text-neutral-500">tools redesign</p>
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
