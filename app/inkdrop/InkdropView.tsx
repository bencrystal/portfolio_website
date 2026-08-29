"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Item {
  id: string;
  title: string;
  filename: string;
  size: number;
  status: string;
  created_at: string;
}

// Vercel serverless rejects bodies over ~4.5MB before route code runs;
// check client-side so the user gets a real error message.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ACCEPT = ".epub,.md,.markdown,.txt,.html,.htm,.docx,.pdf";

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function InkdropView({ token }: { token: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const api = useCallback(
    (path: string) => `/api/inkdrop${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`,
    [token]
  );

  const refresh = useCallback(async () => {
    const res = await fetch(api(""));
    if (res.ok) {
      const { items } = await res.json();
      setItems(items);
    }
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleResponse(res: Response) {
    if (res.ok) {
      setError(null);
      await refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error || `failed (${res.status})`);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        setError(`${file.name} is over the 4 MB upload limit`);
        continue;
      }
      setBusy(`Converting ${file.name}...`);
      const form = new FormData();
      form.append("file", file);
      try {
        await handleResponse(await fetch(api(""), { method: "POST", body: form }));
      } catch {
        setError(`upload failed: ${file.name}`);
      }
    }
    setBusy(null);
  }

  async function submitUrl() {
    const u = url.trim();
    if (!u) return;
    setBusy("Fetching article...");
    try {
      await handleResponse(
        await fetch(api(""), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: u }),
        })
      );
      setUrl("");
    } catch {
      setError("could not reach server");
    }
    setBusy(null);
  }

  async function remove(id: string) {
    await handleResponse(await fetch(api(`/${id}`), { method: "DELETE" }));
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-950 px-5 py-10 text-neutral-100">
      <h1 className="mb-1 text-xl font-semibold">Inkdrop</h1>
      <p className="mb-6 text-sm text-neutral-400">
        Drop a file or paste a link. It becomes an EPUB and syncs to your reader within 6 hours.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInput.current?.click()}
        className={`mb-4 cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center text-sm transition-colors ${
          dragging ? "border-neutral-300 bg-neutral-900 text-neutral-200" : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
        }`}
      >
        Drop files here or click to choose
        <div className="mt-1 text-xs text-neutral-500">epub, md, txt, html, docx, pdf (max 4 MB)</div>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mb-6 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitUrl()}
          placeholder="https://article-to-read..."
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-500"
        />
        <button
          onClick={submitUrl}
          disabled={!!busy}
          className="rounded-md bg-neutral-700 px-4 py-2 text-sm hover:bg-neutral-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {busy && <p className="mb-4 text-sm text-neutral-400">{busy}</p>}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="truncate text-sm">{item.title}</div>
              <div className="text-xs text-neutral-500">
                {fmtSize(item.size)} · {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="ml-3 shrink-0 rounded px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
        {items.length === 0 && !busy && (
          <li className="py-8 text-center text-sm text-neutral-500">Nothing here yet</li>
        )}
      </ul>
    </main>
  );
}
