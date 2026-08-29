"use client";

import { useEffect, useState } from "react";
import InkdropView from "./InkdropView";

const STORAGE_KEY = "inkdrop_token";

// bencrystal.me/inkdrop: token lives in localStorage; /inkdrop/<token>
// saves it and redirects here (same pattern as /list).
export default function InkdropPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem(STORAGE_KEY));
    setLoaded(true);
  }, []);

  function save() {
    const t = input.trim();
    if (!t) return;
    localStorage.setItem(STORAGE_KEY, t);
    setToken(t);
  }

  if (!loaded) return <main className="p-10 text-neutral-200">Loading...</main>;

  if (!token) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-neutral-950 px-5 py-10 text-neutral-100">
        <h1 className="mb-2 text-xl font-semibold">Inkdrop</h1>
        <p className="mb-4 text-sm text-neutral-400">
          Enter your token once. It is saved on this device only.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Token"
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder:text-neutral-500"
          />
          <button onClick={save} className="rounded-md bg-neutral-700 px-4 py-2 hover:bg-neutral-600">
            Save
          </button>
        </div>
      </main>
    );
  }

  return <InkdropView token={token} />;
}
