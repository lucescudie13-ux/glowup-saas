"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";

interface Item {
  id: string;
  name: string;
  done?: boolean;
  category?: string;
  minutes?: number;
}

interface ChecklistManagerProps {
  resource: string; // e.g. "quests"
  initialItems: Item[];
  withMinutes?: boolean;
  withCategory?: boolean;
  togglable?: boolean;
  emptyIcon?: string;
  emptyText?: string;
  addLabel?: string;
}

/**
 * Generic CRUD list bound to /api/<resource>. Powers quests, routine, tasks,
 * mementos, etc. Optimistic-free for clarity: it refreshes server data via
 * router.refresh() after each mutation so KPIs stay in sync.
 */
export function ChecklistManager({
  resource,
  initialItems,
  withMinutes = false,
  withCategory = false,
  togglable = true,
  emptyIcon = "📭",
  emptyText = "Rien pour l’instant. Ajoute ton premier élément.",
  addLabel = "Ajouter",
}: ChecklistManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name };
      if (withMinutes) payload.minutes = Number(minutes || 1);
      if (withCategory && category) payload.category = category;
      const created = await api.post<Item>(`/api/${resource}`, payload);
      setItems((prev) => [...prev, created]);
      setName("");
      setMinutes("");
      setCategory("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Item) {
    try {
      const updated = await api.patch<Item>(`/api/${resource}/${item.id}`, { done: !item.done });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  async function remove(item: Item) {
    try {
      await api.del(`/api/${resource}/${item.id}`);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  return (
    <div className="card">
      <form onSubmit={add} className="inline-form" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          className="auth-input"
          style={{ flex: "2 1 200px" }}
          placeholder="Nom…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {withMinutes && (
          <input
            className="auth-input"
            style={{ flex: "1 1 90px" }}
            type="number"
            min={1}
            placeholder="min"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        )}
        {withCategory && (
          <input
            className="auth-input"
            style={{ flex: "1 1 120px" }}
            placeholder="Catégorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        )}
        <button className="main-btn" type="submit" disabled={busy}>
          {addLabel}
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon}>{emptyText}</EmptyState>
      ) : (
        <ul className="item-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              className="list-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {togglable && (
                <input type="checkbox" checked={!!item.done} onChange={() => toggle(item)} />
              )}
              <span style={{ flex: 1, textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--muted)" : "var(--text)" }}>
                {item.name}
                {withMinutes && item.minutes ? ` · ${item.minutes} min` : ""}
                {withCategory && item.category ? ` · ${item.category}` : ""}
              </span>
              <button className="secondary-btn" onClick={() => remove(item)} aria-label="Supprimer">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
