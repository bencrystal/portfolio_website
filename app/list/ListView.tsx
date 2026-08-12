"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Todo = {
  id: string;
  created_at: string;
  text: string;
  done: boolean;
  bucket_id: string | null;
  position: number;
  all_position: number;
  deleted_at?: string | null;
};
type Bucket = { id: string; name: string; position: number; hidden?: boolean };

const ALL = "all";
const UNSORTED = "unsorted";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ListView({ token }: { token: string }) {
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [view, setView] = useState<string>(ALL); // ALL, UNSORTED, or bucket id
  const [newText, setNewText] = useState("");
  const [search, setSearch] = useState("");
  const [doneOpen, setDoneOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deletedTodos, setDeletedTodos] = useState<Todo[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [newBucketName, setNewBucketName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverChip, setDragOverChip] = useState<string | null>(null);

  const call = useCallback(
    async (path: "todos" | "buckets", method: string, body?: unknown, query = ""): Promise<Response> => {
      const res = await fetch(`/api/scribe/${path}?token=${encodeURIComponent(token)}${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 401) setError("Invalid link.");
      return res;
    },
    [token]
  );

  const refresh = useCallback(async () => {
    const res = await call("todos", "GET");
    if (res.ok) {
      const data = await res.json();
      setTodos(data.todos);
      setBuckets(data.buckets ?? []);
      setError(null);
    }
  }, [call]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000); // pick up captures from other devices
    return () => clearInterval(t);
  }, [refresh]);

  // If the selected bucket disappears or gets hidden, fall back to All.
  useEffect(() => {
    if (view !== ALL && view !== UNSORTED && !buckets.some((b) => b.id === view && !b.hidden)) {
      setView(ALL);
    }
  }, [buckets, view]);

  // ---- todo actions ----

  async function toggle(todo: Todo) {
    setTodos((ts) => ts!.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    await call("todos", "PATCH", { id: todo.id, done: !todo.done });
  }

  async function remove(todo: Todo) {
    setTodos((ts) => ts!.filter((t) => t.id !== todo.id));
    await call("todos", "DELETE", { id: todo.id });
  }

  async function add() {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    await call("todos", "POST", {
      text,
      bucket_id: view === UNSORTED || view === ALL ? null : view,
    });
    refresh();
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
  }

  async function saveEdit() {
    const id = editingId;
    const text = editText.trim();
    setEditingId(null);
    if (!id || !text) return;
    setTodos((ts) => ts!.map((t) => (t.id === id ? { ...t, text } : t)));
    await call("todos", "PATCH", { id, text });
  }

  async function moveToBucket(id: string, bucketId: string | null) {
    setTodos((ts) => ts!.map((t) => (t.id === id ? { ...t, bucket_id: bucketId } : t)));
    await call("todos", "PATCH", { id, bucket_id: bucketId });
  }

  // Drop dragged item onto target: place it just above target in the list.
  // The All view has its own ordering (all_position, seeded from recency)
  // that is independent of the per-bucket order.
  async function reorder(targetId: string) {
    const id = dragId.current;
    if (!id || id === targetId || !todos) return;
    const field = view === ALL ? "all_position" : "position";
    const list = activeList();
    const targetIdx = list.findIndex((t) => t.id === targetId);
    if (targetIdx < 0) return;
    const above = list[targetIdx - 1];
    const target = list[targetIdx];
    const pos = above ? (above[field] + target[field]) / 2 : target[field] + 1;
    setTodos((ts) => ts!.map((t) => (t.id === id ? { ...t, [field]: pos } : t)));
    await call("todos", "PATCH", { id, [field]: pos });
  }

  // ---- bucket actions ----

  async function addBucket() {
    const name = newBucketName.trim();
    if (!name) return;
    setNewBucketName("");
    await call("buckets", "POST", { name });
    refresh();
  }

  async function renameBucket(id: string, name: string) {
    if (!name.trim()) return;
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, name: name.trim() } : b)));
    await call("buckets", "PATCH", { id, name });
  }

  // Hidden buckets keep their items but disappear from the grid,
  // so dormant projects do not clutter the view.
  async function setBucketHidden(id: string, hidden: boolean) {
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, hidden } : b)));
    await call("buckets", "PATCH", { id, hidden });
  }

  async function deleteBucket(id: string) {
    if (!confirm("Delete this bucket? Its items go back to Unsorted.")) return;
    setBuckets((bs) => bs.filter((b) => b.id !== id));
    setTodos((ts) => ts!.map((t) => (t.bucket_id === id ? { ...t, bucket_id: null } : t)));
    await call("buckets", "DELETE", { id });
  }

  // ---- recently deleted ----

  async function loadDeleted() {
    const res = await call("todos", "GET", undefined, "&deleted=1");
    if (res.ok) setDeletedTodos((await res.json()).todos);
  }

  async function restore(id: string) {
    setDeletedTodos((ts) => (ts ? ts.filter((t) => t.id !== id) : ts));
    await call("todos", "PATCH", { id, restore: true });
    refresh();
  }

  // ---- derived lists ----

  function inView(t: Todo) {
    if (view === ALL) return true;
    return view === UNSORTED ? t.bucket_id === null : t.bucket_id === view;
  }
  function matches(t: Todo) {
    return !search.trim() || t.text.toLowerCase().includes(search.trim().toLowerCase());
  }
  function byViewOrder(a: Todo, b: Todo) {
    return view === ALL ? b.all_position - a.all_position : b.position - a.position;
  }
  function activeList() {
    return (todos ?? []).filter((t) => !t.done && inView(t) && matches(t)).sort(byViewOrder);
  }
  function doneList() {
    return (todos ?? []).filter((t) => t.done && inView(t) && matches(t)).sort(byViewOrder);
  }
  function bucketName(id: string | null) {
    return id ? buckets.find((b) => b.id === id)?.name ?? null : null;
  }

  if (error) return <main className="p-10 text-neutral-200">{error}</main>;
  if (!todos) return <main className="p-10 text-neutral-200">Loading...</main>;

  const active = activeList();
  const done = doneList();

  // The All tile is not a drop target: dropping there would not change
  // which bucket an item belongs to.
  const chip = (id: string, label: string, count: number) => (
    <button
      key={id}
      onClick={() => setView(id)}
      onDragOver={
        id === ALL
          ? undefined
          : (e) => {
              e.preventDefault();
              setDragOverChip(id);
            }
      }
      onDragLeave={id === ALL ? undefined : () => setDragOverChip((c) => (c === id ? null : c))}
      onDrop={
        id === ALL
          ? undefined
          : (e) => {
              e.preventDefault();
              setDragOverChip(null);
              if (dragId.current) moveToBucket(dragId.current, id === UNSORTED ? null : id);
            }
      }
      className={`flex min-h-16 flex-col items-start justify-between rounded-lg border p-3 text-left transition-colors ${
        dragOverChip === id
          ? "scale-105 border-blue-400 bg-blue-950 text-blue-200"
          : view === id
            ? "border-neutral-300 bg-neutral-200 text-neutral-900"
            : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
      }`}
    >
      <span className="text-sm font-medium leading-tight">{label}</span>
      <span className="text-xs opacity-60">{count > 0 ? count : "\u00A0"}</span>
    </button>
  );

  const row = (todo: Todo) => (
    <div
      key={todo.id}
      draggable
      onDragStart={() => (dragId.current = todo.id)}
      onDragEnd={() => (dragId.current = null)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        reorder(todo.id);
      }}
      className="relative flex items-center gap-3 border-b border-neutral-800 py-3 pr-9"
    >
      <span className="cursor-grab select-none text-neutral-700" title="Drag to reorder or onto a bucket">
        ::
      </span>
      <input type="checkbox" checked={todo.done} onChange={() => toggle(todo)} className="h-4 w-4" />
      {editingId === todo.id ? (
        <input
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") setEditingId(null);
          }}
          className="flex-1 rounded border border-neutral-600 bg-neutral-900 px-2 py-1 text-neutral-100"
        />
      ) : (
        <span
          onClick={() => startEdit(todo)}
          className={`flex-1 cursor-text ${todo.done ? "text-neutral-600 line-through" : ""}`}
        >
          {todo.text}
        </span>
      )}
      {view === ALL && bucketName(todo.bucket_id) && (
        <span className="shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
          {bucketName(todo.bucket_id)}
        </span>
      )}
      <span className="text-xs text-neutral-600">{fmtDate(todo.created_at)}</span>
      {/* Fixed top-right position on every row so repeated deletes do not
          require moving the pointer. */}
      <button
        onClick={() => remove(todo)}
        className="absolute right-0 top-2 px-2 py-1 text-red-900 hover:text-red-600"
        aria-label="Delete"
      >
        x
      </button>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-neutral-950 px-5 py-6 text-neutral-100">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Todos</h1>
        <button
          onClick={() => {
            setSettingsOpen((o) => !o);
            if (!settingsOpen) loadDeleted();
          }}
          className="rounded-md border border-neutral-700 px-3 py-1 text-sm text-neutral-400 hover:text-neutral-200"
        >
          {settingsOpen ? "Close" : "Settings"}
        </button>
      </div>

      {settingsOpen ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Buckets</h2>
          {buckets.map((b) => (
            <div key={b.id} className="flex items-center gap-2 border-b border-neutral-800 py-2">
              <input
                defaultValue={b.name}
                onBlur={(e) => e.target.value !== b.name && renameBucket(b.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className={`flex-1 rounded border border-transparent bg-transparent px-2 py-1 hover:border-neutral-700 focus:border-neutral-600 focus:bg-neutral-900 ${
                  b.hidden ? "text-neutral-600" : ""
                }`}
              />
              <button
                onClick={() => setBucketHidden(b.id, !b.hidden)}
                className="text-sm text-neutral-500 hover:text-neutral-300"
              >
                {b.hidden ? "Show" : "Hide"}
              </button>
              <button onClick={() => deleteBucket(b.id)} className="text-red-900 hover:text-red-600">
                Delete
              </button>
            </div>
          ))}
          <div className="mt-2 flex gap-2">
            <input
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBucket()}
              placeholder="New bucket"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder:text-neutral-500"
            />
            <button onClick={addBucket} className="rounded-md bg-neutral-700 px-4 py-2 hover:bg-neutral-600">
              Add
            </button>
          </div>

          <h2 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Recently deleted
          </h2>
          <p className="mb-2 text-xs text-neutral-600">Kept for 30 days, then removed for good.</p>
          {deletedTodos === null && <p className="text-neutral-500">Loading...</p>}
          {deletedTodos?.length === 0 && <p className="text-neutral-500">Nothing here.</p>}
          {deletedTodos?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-neutral-800 py-2">
              <span className="flex-1 text-neutral-400">{t.text}</span>
              <span className="text-xs text-neutral-600">{t.deleted_at ? fmtDate(t.deleted_at) : ""}</span>
              <button onClick={() => restore(t.id)} className="text-sm text-blue-500 hover:text-blue-300">
                Restore
              </button>
            </div>
          ))}
        </section>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {chip(ALL, "All", todos.filter((t) => !t.done).length)}
            {chip(UNSORTED, "Unsorted", todos.filter((t) => !t.done && t.bucket_id === null).length)}
            {buckets
              .filter((b) => !b.hidden)
              .map((b) =>
                chip(b.id, b.name, todos.filter((t) => !t.done && t.bucket_id === b.id).length)
              )}
          </div>

          <div className="mb-3 flex gap-2">
            <input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder={view === UNSORTED || view === ALL ? "Add an item" : "Add to this bucket"}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 placeholder:text-neutral-500"
            />
            <button onClick={add} className="rounded-md bg-neutral-700 px-4 py-2 hover:bg-neutral-600">
              Add
            </button>
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="mb-4 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm placeholder:text-neutral-600"
          />

          {active.length === 0 && done.length === 0 && (
            <p className="text-neutral-500">
              {search.trim() ? "No matches." : "Nothing yet. Hold the button and talk."}
            </p>
          )}
          {active.map(row)}

          {done.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setDoneOpen((o) => !o)}
                className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500 hover:text-neutral-300"
              >
                {doneOpen ? "v" : ">"} Done ({done.length})
              </button>
              {doneOpen && done.map(row)}
            </div>
          )}
        </>
      )}
    </main>
  );
}
