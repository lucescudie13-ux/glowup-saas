"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableList } from "@/components/ui/sortable-list";
import { persistPositions } from "@/lib/reorder";
import type { Danger } from "@/types";

export function DangersManager({ initialItems }: { initialItems: Danger[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Danger[]>(initialItems);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });

  function startEdit(d: Danger) {
    setEditingId(d.id);
    setEditDraft({ name: d.name, description: d.description ?? "" });
  }
  async function saveEdit(d: Danger) {
    const patch = { name: editDraft.name.trim() || d.name, description: editDraft.description.trim() };
    setItems((prev) => prev.map((i) => (i.id === d.id ? { ...i, ...patch } : i))); // optimistic
    setEditingId(null);
    try {
      await api.patch(`/api/dangers/${d.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Danger>("/api/dangers", { name: name.trim(), description: description.trim(), position: items.length });
      setItems((prev) => [...prev, created]);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await api.del(`/api/dangers/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  return (
    <div className="card">
      <form onSubmit={add} style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        <input className="auth-input" placeholder="Danger / mauvaise habitude (ex. Manque de sommeil)" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="auth-input"
          style={{ minHeight: 64, resize: "vertical" }}
          placeholder="Ce que ça provoque (ex. fatigue, manque de concentration, irritabilité…)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button className="main-btn" type="submit" disabled={busy} style={{ justifySelf: "start" }}>Ajouter</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {items.length === 0 ? (
        <EmptyState icon="🧨">Aucun danger listé. Identifie ce qui te freine.</EmptyState>
      ) : (
        <SortableList items={items} onReorder={(o) => { setItems(o); persistPositions("dangers", o); }} gap={10}>
          {(d) => (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px",
                borderRadius: 10,
                borderLeft: "3px solid var(--danger)",
                background: "rgba(255, 90, 110, 0.06)",
              }}
            >
              {editingId === d.id ? (
                <div style={{ flex: 1, display: "grid", gap: 6 }}>
                  <input className="auth-input" value={editDraft.name} onChange={(e) => setEditDraft((s) => ({ ...s, name: e.target.value }))} placeholder="Danger" autoFocus />
                  <textarea className="auth-input" style={{ minHeight: 56, resize: "vertical" }} value={editDraft.description} onChange={(e) => setEditDraft((s) => ({ ...s, description: e.target.value }))} placeholder="Ce que ça provoque" />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="checklist-submit" onClick={() => saveEdit(d)}>OK</button>
                    <button className="secondary-btn" onClick={() => setEditingId(null)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--danger-soft)" }}>{d.name}</div>
                    {d.description ? <p className="card-sub" style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{d.description}</p> : null}
                  </div>
                  <button className="secondary-btn" onClick={() => startEdit(d)} aria-label="Modifier" title="Modifier">✏️</button>
                  <button className="secondary-btn" onClick={() => remove(d.id)} aria-label="Supprimer">✕</button>
                </>
              )}
            </div>
          )}
        </SortableList>
      )}
    </div>
  );
}
