"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Objective, ObjectivePeriod } from "@/types";

export function ObjectivesManager({ initialItems }: { initialItems: Objective[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Objective[]>(initialItems);
  const [period, setPeriod] = useState<ObjectivePeriod>("monthly");
  const [name, setName] = useState("");
  const [actions, setActions] = useState("");
  const [busy, setBusy] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editActions, setEditActions] = useState("");

  const visible = items.filter((o) => o.period === period);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await api.post<Objective>("/api/objectives", { period, name, actions });
      setItems((prev) => [...prev, created]);
      setName("");
      setActions("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(o: Objective) {
    setEditingId(o.id);
    setEditName(o.name);
    setEditActions(o.actions ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(o: Objective) {
    const patch = { name: editName.trim() || o.name, actions: editActions };
    setItems((prev) => prev.map((i) => (i.id === o.id ? { ...i, ...patch } : i))); // optimistic
    setEditingId(null);
    try {
      await api.patch(`/api/objectives/${o.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  // Update the bar instantly while dragging (no network).
  function changeProgress(o: Objective, progress: number) {
    setItems((prev) => prev.map((i) => (i.id === o.id ? { ...i, progress } : i)));
  }
  async function commitProgress(o: Objective, progress: number) {
    try {
      await api.patch(`/api/objectives/${o.id}`, { progress });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await api.del(`/api/objectives/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  return (
    <div className="card">
      <div className="section-tabs">
        <button type="button" className={`tab${period === "monthly" ? " active" : ""}`} onClick={() => setPeriod("monthly")}>
          📅 Du mois
        </button>
        <button type="button" className={`tab${period === "yearly" ? " active" : ""}`} onClick={() => setPeriod("yearly")}>
          🗓️ De l’année
        </button>
      </div>

      <form onSubmit={add} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <input className="auth-input" placeholder="Objectif" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="auth-input"
          placeholder="Actions clés (optionnel) — Entrée pour aller à la ligne"
          value={actions}
          onChange={(e) => setActions(e.target.value)}
          rows={3}
          style={{ resize: "vertical" }}
        />
        <button className="checklist-submit" type="submit" disabled={busy} style={{ justifySelf: "start" }}>
          Ajouter l’objectif
        </button>
      </form>

      {visible.length === 0 ? (
        <EmptyState icon="🎯">Aucun objectif {period === "monthly" ? "du mois" : "de l’année"}.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {visible.map((o) => (
            <div className="objective" key={o.id}>
              {editingId === o.id ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <input className="auth-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Objectif" />
                  <textarea
                    className="auth-input"
                    value={editActions}
                    onChange={(e) => setEditActions(e.target.value)}
                    placeholder="Actions clés — Entrée pour aller à la ligne"
                    rows={4}
                    style={{ resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="checklist-submit" onClick={() => saveEdit(o)} style={{ minWidth: 120 }}>
                      Enregistrer
                    </button>
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="objective-head">
                    <span className="objective-name">{o.name}</span>
                    <div className="objective-controls" style={{ alignItems: "center" }}>
                      <button type="button" className="task-del" onClick={() => startEdit(o)} aria-label="Modifier" title="Modifier">✏️</button>
                      <button type="button" className="task-del" onClick={() => remove(o.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                    </div>
                  </div>
                  {o.actions ? <div className="objective-actions">{o.actions}</div> : null}
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="big-bar-fill" style={{ width: `${o.progress}%` }} /></div>
                    <span className="objective-percent">{o.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={o.progress}
                    onChange={(e) => changeProgress(o, Number(e.target.value))}
                    onMouseUp={(e) => commitProgress(o, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => commitProgress(o, Number((e.target as HTMLInputElement).value))}
                    onKeyUp={(e) => commitProgress(o, Number((e.target as HTMLInputElement).value))}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
