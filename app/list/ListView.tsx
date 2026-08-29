"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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
type Bucket = { id: string; name: string; position: number; hidden?: boolean; color?: string | null };

const ALL = "all";
const UNSORTED = "unsorted";

// "5m ago" style for the first week, then a plain date.
function fmtDate(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86_400) return `${Math.floor(s / 86_400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Stable accent color per bucket, derived from its id with the same djb2
// hash as the iOS app so both agree without storing anything.
const BUCKET_PALETTE = ["#3b82f6", "#22c55e", "#f97316", "#ec4899", "#a855f7", "#14b8a6", "#6366f1", "#ef4444"];
function bucketColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return BUCKET_PALETTE[h % BUCKET_PALETTE.length];
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
  const knownIds = useRef<Set<string> | null>(null); // for spotting fresh captures
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  // Which row's copy or add-to-copy button just fired (for the checkmark).
  const [copied, setCopied] = useState<{ id: string; kind: "copy" | "add" } | null>(null);
  // What we last put on the clipboard; while set (30s window) every row
  // offers an add-to-copy button that appends its task on a new line.
  const [copyBuf, setCopyBuf] = useState<string | null>(null);
  const copyBufTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One shared undo toast for both destructive-feeling actions: deleting
  // a task and checking it done (which whisks it out of the active list).
  const [lastUndo, setLastUndo] = useState<{ todo: Todo; kind: "deleted" | "done" } | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);
  // iOS Safari never fires HTML5 drag events, so touch dragging runs on
  // pointer events instead: the drag handle captures the pointer and
  // elementFromPoint hit-tests chips and rows under the finger.
  const [touchGhost, setTouchGhost] = useState<{ text: string; x: number; y: number } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const prevTops = useRef(new Map<string, number>());

  // FLIP: whenever rows land in new spots (reorder, bucket move, fresh
  // capture), slide them from where they were instead of snapping.
  useLayoutEffect(() => {
    const tops = new Map<string, number>();
    rowRefs.current.forEach((el, id) => {
      if (!el.isConnected) {
        rowRefs.current.delete(id);
        return;
      }
      tops.set(id, el.getBoundingClientRect().top);
    });
    tops.forEach((top, id) => {
      const prev = prevTops.current.get(id);
      const el = rowRefs.current.get(id);
      if (!el || prev === undefined || Math.abs(prev - top) < 1) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${prev - top}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.3s ease";
        el.style.transform = "";
        el.addEventListener(
          "transitionend",
          () => {
            // Hand transitions back to the classes (color fades).
            el.style.transition = "";
          },
          { once: true }
        );
      });
    });
    prevTops.current = tops;
  });

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
      // Briefly highlight captures that just arrived from a recording.
      const idList = (data.todos as Todo[]).map((t) => t.id);
      const ids = new Set<string>(idList);
      if (knownIds.current) {
        const fresh = idList.filter((id) => !knownIds.current!.has(id));
        if (fresh.length) {
          setFlashIds((f) => {
            const next = new Set(Array.from(f));
            fresh.forEach((id) => next.add(id));
            return next;
          });
          setTimeout(() => {
            setFlashIds((f) => {
              const next = new Set(f);
              fresh.forEach((id) => next.delete(id));
              return next;
            });
          }, 2000);
        }
      }
      knownIds.current = ids;
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

  // The toast fades out before it unmounts instead of vanishing.
  function showUndo(todo: Todo, kind: "deleted" | "done") {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (undoClearTimer.current) clearTimeout(undoClearTimer.current);
    setLastUndo({ todo, kind });
    setUndoVisible(true);
    undoTimer.current = setTimeout(() => setUndoVisible(false), 8000);
    undoClearTimer.current = setTimeout(() => setLastUndo(null), 8600);
  }

  async function toggle(todo: Todo) {
    setTodos((ts) => ts!.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    // Checking done removes the row from the active list immediately, so
    // give the same undo window a delete gets.
    if (!todo.done) showUndo(todo, "done");
    await call("todos", "PATCH", { id: todo.id, done: !todo.done });
  }

  async function remove(todo: Todo) {
    setTodos((ts) => ts!.filter((t) => t.id !== todo.id));
    // The delete is soft on the server, so restoring is just a PATCH away.
    showUndo(todo, "deleted");
    await call("todos", "DELETE", { id: todo.id });
  }

  async function undoLast() {
    const u = lastUndo;
    if (!u) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (undoClearTimer.current) clearTimeout(undoClearTimer.current);
    setUndoVisible(false);
    setLastUndo(null);
    if (u.kind === "deleted") {
      await call("todos", "PATCH", { id: u.todo.id, restore: true });
      setTodos((ts) => (ts ? [...ts, u.todo] : ts));
    } else {
      setTodos((ts) => ts!.map((t) => (t.id === u.todo.id ? { ...t, done: false } : t)));
      await call("todos", "PATCH", { id: u.todo.id, done: false });
    }
  }

  function setClipboard(text: string, id: string, kind: "copy" | "add") {
    navigator.clipboard.writeText(text);
    if (copyBufTimer.current) clearTimeout(copyBufTimer.current);
    setCopyBuf(text);
    copyBufTimer.current = setTimeout(() => setCopyBuf(null), 30000);
    setCopied({ id, kind });
    setTimeout(() => setCopied((c) => (c?.id === id && c.kind === kind ? null : c)), 1500);
  }

  function copyText(todo: Todo) {
    setClipboard(todo.text, todo.id, "copy");
  }

  // Appends this task to the last-copied text, one task per line. We track
  // the text ourselves since iOS will not let the page read the clipboard.
  function appendCopy(todo: Todo) {
    if (!copyBuf) return;
    setClipboard(`${copyBuf}\n${todo.text}`, todo.id, "add");
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
  async function reorder(id: string, targetId: string) {
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

  // ---- touch drag (pointer events; HTML5 DnD does not fire on iOS) ----

  function dropTargetAt(x: number, y: number) {
    const el = document.elementFromPoint(x, y);
    const chipId = el?.closest<HTMLElement>("[data-chip-id]")?.dataset.chipId ?? null;
    const rowId = el?.closest<HTMLElement>("[data-row-id]")?.dataset.rowId ?? null;
    // The All chip is not a drop target (dropping there changes nothing).
    return { chipId: chipId === ALL ? null : chipId, rowId };
  }

  function touchDragStart(e: React.PointerEvent, todo: Todo) {
    if (e.pointerType !== "touch") return; // mouse keeps the HTML5 path
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragId.current = todo.id;
    setTouchGhost({ text: todo.text, x: e.clientX, y: e.clientY });
  }

  function touchDragMove(e: React.PointerEvent) {
    if (!dragId.current || !touchGhost) return;
    setTouchGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
    const { chipId, rowId } = dropTargetAt(e.clientX, e.clientY);
    setDragOverChip(chipId);
    setDragOverRow(chipId ? null : rowId !== dragId.current ? rowId : null);
  }

  function touchDragEnd(e: React.PointerEvent) {
    const id = dragId.current;
    if (!id || !touchGhost) return;
    dragId.current = null;
    setTouchGhost(null);
    setDragOverChip(null);
    setDragOverRow(null);
    if (e.type === "pointercancel") return;
    const { chipId, rowId } = dropTargetAt(e.clientX, e.clientY);
    if (chipId) moveToBucket(id, chipId === UNSORTED ? null : chipId);
    else if (rowId && rowId !== id) reorder(id, rowId);
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

  // null resets to the automatic hash-derived color.
  async function setBucketColor(id: string, color: string | null) {
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, color } : b)));
    await call("buckets", "PATCH", { id, color });
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
  // Stored custom color wins; otherwise the stable hash-derived one.
  function colorOf(id: string) {
    return buckets.find((b) => b.id === id)?.color || bucketColor(id);
  }

  if (error) return <main className="p-10 text-neutral-200">{error}</main>;
  if (!todos) return <main className="p-10 text-neutral-200">Loading...</main>;

  const active = activeList();
  const done = doneList();

  // The All tile is not a drop target: dropping there would not change
  // which bucket an item belongs to. Bucket tiles highlight in their own
  // color when selected or when a dragged task hovers over them.
  const chip = (id: string, label: string, count: number) => {
    const c = id === ALL || id === UNSORTED ? null : colorOf(id);
    const over = dragOverChip === id;
    const selected = view === id;
    return (
      <button
        key={id}
        data-chip-id={id}
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
          over ? "scale-105" : ""
        } ${
          c
            ? "text-neutral-200 hover:brightness-125"
            : over
              ? "border-blue-400 bg-blue-950 text-blue-200"
              : selected
                ? "border-neutral-300 bg-neutral-200 text-neutral-900"
                : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
        }`}
        style={
          c
            ? over
              ? { borderColor: c, backgroundColor: `${c}59` }
              : selected
                ? { borderColor: c, backgroundColor: `${c}2e` }
                : { borderColor: "#404040", backgroundColor: "#171717" }
            : undefined
        }
      >
        <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
          {c && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c }} />}
          {label}
        </span>
        <span className="text-xs opacity-60">{count > 0 ? count : "\u00A0"}</span>
      </button>
    );
  };

  const row = (todo: Todo) => (
    // Wrapper owns the drop targeting so an animated gap can open above
    // the row, previewing where the dragged task would land.
    <div
      key={todo.id}
      data-row-id={todo.id}
      ref={(el) => {
        if (el) rowRefs.current.set(todo.id, el);
        else rowRefs.current.delete(todo.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (dragId.current && dragId.current !== todo.id) setDragOverRow(todo.id);
      }}
      onDragLeave={() => setDragOverRow((r) => (r === todo.id ? null : r))}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverRow(null);
        if (dragId.current) reorder(dragId.current, todo.id);
      }}
    >
      <div
        className="pointer-events-none"
        style={{
          height: dragOverRow === todo.id && dragId.current !== todo.id ? 44 : 0,
          transition: "height 0.15s ease",
        }}
      />
      <div
        draggable
        onDragStart={() => (dragId.current = todo.id)}
        onDragEnd={() => {
          dragId.current = null;
          setDragOverRow(null);
        }}
        className={`relative flex items-center gap-3 border-b border-neutral-800 py-3 transition-colors duration-1000 ${
          copyBuf ? "pr-24" : "pr-16"
        }`}
      // Fresh captures glow briefly; in All, rows carry a whisper of their
      // bucket's color under everything else.
      style={
        flashIds.has(todo.id)
          ? { backgroundColor: "rgba(147, 197, 253, 0.15)" }
          : todo.bucket_id
            ? // Tinted in every view, not just All: inside a bucket the
              // wash of its color confirms which bucket is on screen.
              { backgroundColor: `${colorOf(todo.bucket_id)}1f` }
            : undefined
      }
    >
      {/* touch-none stops iOS from scrolling instead of dragging; the
          padding widens the touch target beyond the two glyphs. */}
      <span
        className="-my-3 -ml-2 cursor-grab touch-none select-none py-3 pl-2 pr-1 text-neutral-700"
        title="Drag to reorder or onto a bucket"
        onPointerDown={(e) => touchDragStart(e, todo)}
        onPointerMove={touchDragMove}
        onPointerUp={touchDragEnd}
        onPointerCancel={touchDragEnd}
      >
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
      {view === ALL && todo.bucket_id && bucketName(todo.bucket_id) && (
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-xs"
          style={{ color: colorOf(todo.bucket_id), backgroundColor: `${colorOf(todo.bucket_id)}33` }}
        >
          {bucketName(todo.bucket_id)}
        </span>
      )}
      <span className="text-xs text-neutral-600">{fmtDate(todo.created_at)}</span>
      {/* Padded well past the glyphs so they are easy to hit on the phone. */}
      {copyBuf && (
        <button
          onClick={() => appendCopy(todo)}
          className="absolute right-16 top-0.5 p-2 text-neutral-600 hover:text-neutral-300"
          aria-label="Add to copied text"
          title="Add to copied text (new line)"
        >
          {copied?.id === todo.id && copied.kind === "add" ? "\u2713" : "+\u29c9"}
        </button>
      )}
      <button
        onClick={() => copyText(todo)}
        className="absolute right-8 top-0.5 p-2 text-neutral-600 hover:text-neutral-300"
        aria-label="Copy text"
        title="Copy text"
      >
        {copied?.id === todo.id && copied.kind === "copy" ? "\u2713" : "\u29c9"}
      </button>
      {/* Fixed top-right position on every row so repeated deletes do not
          require moving the pointer. */}
      <button
        onClick={() => remove(todo)}
        className="absolute right-0 top-0.5 p-2 text-red-900 hover:text-red-600"
        aria-label="Delete"
      >
        x
      </button>
      </div>
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
                type="color"
                value={colorOf(b.id)}
                // Update locally while the picker drags, save when it closes.
                onChange={(e) => setBuckets((bs) => bs.map((x) => (x.id === b.id ? { ...x, color: e.target.value } : x)))}
                onBlur={(e) => call("buckets", "PATCH", { id: b.id, color: e.target.value })}
                className="h-6 w-6 shrink-0 cursor-pointer rounded border-none bg-transparent"
                title="Bucket color"
              />
              {b.color && (
                <button
                  onClick={() => setBucketColor(b.id, null)}
                  className="text-xs text-neutral-600 hover:text-neutral-400"
                  title="Reset to automatic color"
                >
                  Auto
                </button>
              )}
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

      {touchGhost && (
        <div
          className="pointer-events-none fixed z-20 max-w-[70vw] -translate-x-1/2 truncate rounded-md border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-200 shadow-lg"
          // Held above the finger so it stays visible while dragging.
          style={{ left: touchGhost.x, top: touchGhost.y - 48 }}
        >
          {touchGhost.text}
        </div>
      )}

      {lastUndo && (
        <div
          className={`fixed left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm shadow-lg transition-opacity duration-500 ${undoVisible ? "opacity-100" : "opacity-0"}`}
          // Lifted well clear of the mobile browser toolbar; bottom-6 hid
          // it behind Safari's bottom bar on the phone.
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
        >
          <span className="text-neutral-300">{lastUndo.kind === "deleted" ? "Deleted" : "Marked done"}</span>
          <button onClick={undoLast} className="font-medium text-blue-400 hover:text-blue-200">
            Undo
          </button>
        </div>
      )}
    </main>
  );
}
