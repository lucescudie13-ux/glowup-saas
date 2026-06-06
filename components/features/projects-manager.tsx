"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ProgressBar } from "@/components/ui/progress-bar";
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

  async function setProgress(item: Project, progress: number) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress } : i)));
    await api.patch(`/api/projects/${item.id}`, { progress });
    router.refresh();
  }

  async function remove(id: string) {
    await api.del(`/api/projects/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="card">
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input className="auth-input" style={{ flex: 1 }} placeholder="Nom du projet" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="main-btn" type="submit" disabled={busy}>Ajouter</button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon="🚀">Aucun projet en cours.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {items.map((p) => (
            <div key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <strong>{p.name}</strong>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="card-sub">{p.progress}%</span>
                  <button className="secondary-btn" onClick={() => remove(p.id)}>✕</button>
                </div>
              </div>
              <ProgressBar value={p.progress} />
              <input
                type="range"
                min={0}
                max={100}
                value={p.progress}
                onChange={(e) => setProgress(p, Number(e.target.value))}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
