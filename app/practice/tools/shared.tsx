"use client";

import { RESOURCES, ToolsEngine } from "./useTools";

// Styling tokens + the sections whose design stays constant across variants
// (backing tracks, resources). Hero tools (metronome/key/timer) are what the
// ?redesign variants reinterpret.

export const card = "rounded-xl border border-neutral-800 bg-neutral-900/60 p-4";
export const btn =
  "rounded-md border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 hover:bg-neutral-700 active:bg-neutral-600";
export const input =
  "rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500";
export const label = "text-xs uppercase tracking-wide text-neutral-500";

export function HeaderNav() {
  return (
    <header className="flex items-baseline justify-between">
      <h1 className="text-lg font-semibold">Practice tools</h1>
      <nav className="flex gap-3 text-sm text-neutral-400">
        <a href="/practice/plan" className="hover:text-neutral-200">
          the plan →
        </a>
        <a href="/practice/log" className="hover:text-neutral-200">
          my log →
        </a>
      </nav>
    </header>
  );
}

export function BackingTracks({ t }: { t: ToolsEngine }) {
  const isFav = t.playing && t.favs.some((f) => f.id === t.playing!.id);
  return (
    <>
      <div className="mt-2 flex gap-2">
        <input
          value={t.ytInput}
          onChange={(e) => t.setYtInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && t.submitYt()}
          placeholder={t.searchEnabled ? "paste a YouTube link or search…" : "paste a YouTube link…"}
          className={`${input} min-w-0 flex-1`}
        />
        <button className={btn} onClick={t.submitYt} disabled={t.searching}>
          {t.searching ? "…" : t.searchEnabled ? "go" : "play"}
        </button>
        {t.favs.length > 0 && (
          <select
            className={`${input} max-w-[10rem]`}
            value=""
            onChange={(e) => {
              const f = t.favs.find((x) => x.id === e.target.value);
              if (f) t.setPlaying(f);
            }}
            aria-label="saved tracks"
          >
            <option value="" disabled>
              saved ({t.favs.length})
            </option>
            {t.favs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title}
              </option>
            ))}
          </select>
        )}
      </div>
      <p className="mt-1.5 text-xs text-neutral-500">
        Saved links are stored only in this browser (local storage, like a cookie) — pick them again from the “saved”
        dropdown any time.
      </p>
      {t.results && (
        <ul className="mt-2 divide-y divide-neutral-800 rounded-md border border-neutral-800">
          {t.results.length === 0 && <li className="p-2 text-sm text-neutral-500">no results</li>}
          {t.results.map((r) => (
            <li key={r.id}>
              <button
                className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-neutral-800/60"
                onClick={() => {
                  t.setPlaying({ id: r.id, title: r.title });
                  t.setResults(null);
                  t.setYtInput("");
                }}
              >
                {r.thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumb} alt="" className="h-9 w-16 rounded object-cover" />
                )}
                <span className="min-w-0">
                  <span className="block truncate">{r.title}</span>
                  <span className="block truncate text-xs text-neutral-500">{r.channel}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {t.playing && (
        <div className="mt-3">
          <div className="aspect-video w-full max-w-md overflow-hidden rounded-lg border border-neutral-800">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${t.playing.id}?autoplay=1`}
              title="backing track"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <div className="mt-1.5 flex gap-3 text-sm">
            <button
              className="text-neutral-400 hover:text-amber-400"
              onClick={() =>
                isFav
                  ? t.saveFavs(t.favs.filter((f) => f.id !== t.playing!.id))
                  : t.saveFavs([...t.favs, { id: t.playing!.id, title: t.playing!.title.slice(0, 80) }])
              }
            >
              {isFav ? "★ saved on this device" : "☆ save on this device"}
            </button>
            <button className="text-neutral-500 hover:text-neutral-300" onClick={() => t.setPlaying(null)}>
              close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function Resources() {
  return (
    <ul className="mt-2 space-y-1.5 text-sm">
      {RESOURCES.map((r) => (
        <li key={r.url}>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-200 underline decoration-neutral-700 underline-offset-2 hover:decoration-amber-500"
          >
            {r.url.endsWith(".pdf") ? "▤" : "▶"} {r.label}
          </a>
          <span className="text-neutral-500"> — {r.note}</span>
        </li>
      ))}
    </ul>
  );
}
