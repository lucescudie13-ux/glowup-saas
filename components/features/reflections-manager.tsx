"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableList } from "@/components/ui/sortable-list";
import { persistPositions } from "@/lib/reorder";
import { formatDayLabel } from "@/lib/utils";
import type { Reflection } from "@/types";

export function ReflectionsManager({ initialItems }: { initialItems: Reflection[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Reflection[]>(initialItems);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: "", topic: "", body: "" });
  const [filter, setFilter] = useState<string>("");

  const topics = useMemo(
    () => Array.from(new Set(items.map((i) => i.topic).filter(Boolean))).sort(),
    [items]
  );

  // Pinned first, then by manual position (drag order).
  const sorted = useMemo(() => {
    const list = filter ? items.filter((i) => i.topic === filter) : items;
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }, [items, filter]);

  function reorder(ordered: Reflection[]) {
    const pos = new Map(ordered.map((r, i) => [r.id, i]));
    setItems((prev) => prev.map((r) => (pos.has(r.id) ? { ...r, position: pos.get(r.id)! } : r)));
    persistPositions("reflections", ordered);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Reflection>("/api/reflections", {
        title: title.trim(),
        topic: topic.trim() || "Général",
        body: body.trim(),
        position: items.length,
      });
      setItems((prev) => [...prev, created]);
      setTitle("");
      setTopic("");
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, data: Partial<Reflection>) {
    const snapshot = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    try {
      await api.patch<Reflection>(`/api/reflections/${id}`, data);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await api.del(`/api/reflections/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  function startEdit(r: Reflection) {
    setEditId(r.id);
    setDraft({ title: r.title, topic: r.topic, body: r.body });
  }

  async function saveEdit(id: string) {
    await patch(id, { title: draft.title.trim(), topic: draft.topic.trim() || "Général", body: draft.body.trim() });
    setEditId(null);
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <form onSubmit={add} style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input className="auth-input" style={{ flex: "2 1 220px" }} placeholder="Titre (ex. Pourquoi je procrastine ?)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 140px" }} placeholder="Sujet" value={topic} onChange={(e) => setTopic(e.target.value)} list="reflection-topics" />
            <datalist id="reflection-topics">
              {topics.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>
          <textarea className="auth-input" style={{ minHeight: 90, resize: "vertical" }} placeholder="Tes notes, idées, questions à creuser…" value={body} onChange={(e) => setBody(e.target.value)} />
          <div>
            <button className="main-btn" type="submit" disabled={busy}>Ajouter une réflexion</button>
          </div>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>

      {topics.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button className={`secondary-btn${filter === "" ? " active" : ""}`} onClick={() => setFilter("")}>Tout</button>
          {topics.map((t) => (
            <button key={t} className={`secondary-btn${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{t}</button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState icon="🪞">Aucune réflexion. Note un sujet qui te trotte dans la tête.</EmptyState>
      ) : (
        <SortableList items={sorted} onReorder={reorder} gap={12}>
          {(r) => (
            <div className="card" style={{ borderLeft: r.pinned ? "3px solid var(--cyan)" : undefined }}>
              {editId === r.id ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <input className="auth-input" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Titre" />
                  <input className="auth-input" value={draft.topic} onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))} placeholder="Sujet" />
                  <textarea className="auth-input" style={{ minHeight: 90, resize: "vertical" }} value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="main-btn" onClick={() => saveEdit(r.id)}>Enregistrer</button>
                    <button className="secondary-btn" onClick={() => setEditId(null)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="card-head" style={{ alignItems: "flex-start" }}>
                    <div>
                      <h3 className="card-title" style={{ marginBottom: 2 }}>{r.title || "(sans titre)"}</h3>
                      <div className="card-sub">{r.topic} · {formatDayLabel((r.created_at ?? "").slice(0, 10))}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="secondary-btn" title={r.pinned ? "Désépingler" : "Épingler"} onClick={() => patch(r.id, { pinned: !r.pinned })}>{r.pinned ? "📌" : "📍"}</button>
                      <button className="secondary-btn" title="Modifier" onClick={() => startEdit(r)}>✏️</button>
                      <button className="secondary-btn" title="Supprimer" onClick={() => remove(r.id)}>✕</button>
                    </div>
                  </div>
                  {r.body && <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{r.body}</p>}
                </>
              )}
            </div>
          )}
        </SortableList>
      )}
    </div>
  );
}
