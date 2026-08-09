"use client";

import { useCallback, useEffect, useState } from "react";

type Todo = { id: string; created_at: string; text: string; done: boolean };

export default function ListPage({ params }: { params: { token: string } }) {
  const { token } = params;
  const [todos, setTodos] = useState<Todo[] | null>(null);
  const [newText, setNewText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(
    async (method: string, body?: unknown): Promise<Response> => {
      const res = await fetch(`/api/scribe/todos?token=${encodeURIComponent(token)}`, {
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
    const res = await api("GET");
    if (res.ok) {
      setTodos((await res.json()).todos);
      setError(null);
    }
  }, [api]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000); // pick up captures from other devices
    return () => clearInterval(t);
  }, [refresh]);

  async function toggle(todo: Todo) {
    setTodos((ts) => ts!.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    await api("PATCH", { id: todo.id, done: !todo.done });
  }

  async function remove(todo: Todo) {
    setTodos((ts) => ts!.filter((t) => t.id !== todo.id));
    await api("DELETE", { id: todo.id });
  }

  async function add() {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    await api("POST", { text });
    refresh();
  }

  if (error) return <main className="p-10 text-neutral-200">{error}</main>;
  if (!todos) return <main className="p-10 text-neutral-200">Loading...</main>;

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-neutral-950 px-5 py-6 text-neutral-100">
      <h1 className="mb-4 text-xl font-semibold">Todos</h1>
      <div className="mb-4 flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add an item"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder:text-neutral-500"
        />
        <button onClick={add} className="rounded-md bg-neutral-700 px-4 py-2 hover:bg-neutral-600">
          Add
        </button>
      </div>
      {todos.length === 0 && (
        <p className="text-neutral-500">Nothing yet. Hold the button and talk.</p>
      )}
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center gap-3 border-b border-neutral-800 py-3">
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggle(todo)}
            className="h-4 w-4"
          />
          <span className={todo.done ? "flex-1 text-neutral-600 line-through" : "flex-1"}>
            {todo.text}
          </span>
          <span className="text-xs text-neutral-600">
            {new Date(todo.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <button
            onClick={() => remove(todo)}
            className="text-red-900 hover:text-red-600"
            aria-label="Delete"
          >
            x
          </button>
        </div>
      ))}
    </main>
  );
}
