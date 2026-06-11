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
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await api.post<Project>("/api/projects", { name });
      setItems((prev) => [...prev, created]);
      setName("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // Update the bar instantly while dragging (no network).
  function changeProgress(item: Project, progress: number) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
  }

  // Persist once, when the slider is released.
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
      <form onSubmit={add} className="checklist-add">
        <input className="auth-input" style={{ flex: "3 1 220px" }} placeholder="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="checklist-submit" type="submit" disabled={busy}>Ajouter</button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon="🚀">Aucun projet en cours.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((p) => (
            <div className="objective" key={p.id}>
              <div className="objective-head">
                <span className="objective-name">{p.name}</span>
                <button type="button" className="task-del" onClick={() => remove(p.id)} aria-label="Supprimer" title="Supprimer">✕</button>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
