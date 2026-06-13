"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Project } from "@/types";

export function ProjectsManager({ initialItems }: { initialItems: Project[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Project[]>(initialItems);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await api.post<Project>("/api/projects", { name, description });
      setItems((prev) => [...prev, created]);
      setName("");
      setDescription("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setEditName(p.name);
    setEditDescription(p.description ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(p: Project) {
    const patch = { name: editName.trim() || p.name, description: editDescription };
    setItems((prev) => prev.map((i) => (i.id === p.id ? { ...i, ...patch } : i))); // optimistic
    setEditingId(null);
    try {
      await api.patch(`/api/projects/${p.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  // Update the bar instantly while dragging (no network).
  function changeProgress(item: Project, progress: number) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
  }
  async function commitProgress(item: Project, progress: number) {
    try {
      await api.patch(`/api/projects/${item.id}`, { progress });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function remove(id: string) {
    const snapshot = items;
    setItems((prev) => prev.filter((i) => i.id !== id)); // optimistic
    try {
      await api.del(`/api/projects/${id}`);
      router.refresh();
    } catch {
      setItems(snapshot);
    }
  }

  return (
    <div className="card">
      <form onSubmit={add} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <input className="auth-input" placeholder="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="auth-input"
          placeholder="Description (optionnel) — Entrée pour aller à la ligne"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ resize: "vertical" }}
        />
        <button className="checklist-submit" type="submit" disabled={busy} style={{ justifySelf: "start" }}>Ajouter le projet</button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon="🚀">Aucun projet en cours.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((p) => (
            <div className="objective" key={p.id}>
              {editingId === p.id ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <input className="auth-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom du projet" />
                  <textarea
                    className="auth-input"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description — Entrée pour aller à la ligne"
                    rows={4}
                    style={{ resize: "vertical" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="checklist-submit" onClick={() => saveEdit(p)} style={{ minWidth: 120 }}>Enregistrer</button>
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="objective-head">
                    <span className="objective-name">{p.name}</span>
                    <div className="objective-controls" style={{ alignItems: "center" }}>
                      <button type="button" className="task-del" onClick={() => startEdit(p)} aria-label="Modifier" title="Modifier">✏️</button>
                      <button type="button" className="task-del" onClick={() => remove(p.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                    </div>
                  </div>
                  {p.description ? <div className="objective-actions">{p.description}</div> : null}
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="big-bar-fill" style={{ width: `${p.progress}%` }} /></div>
                    <span className="objective-percent">{p.progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={p.progress}
                    onChange={(e) => changeProgress(p, Number(e.target.value))}
                    onMouseUp={(e) => commitProgress(p, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => commitProgress(p, Number((e.target as HTMLInputElement).value))}
                    onKeyUp={(e) => commitProgress(p, Number((e.target as HTMLInputElement).value))}
                    className="range-input"
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
