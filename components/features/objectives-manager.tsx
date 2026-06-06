"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import type { Objective, ObjectivePeriod } from "@/types";

export function ObjectivesManager({ initialItems }: { initialItems: Objective[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Objective[]>(initialItems);
  const [period, setPeriod] = useState<ObjectivePeriod>("monthly");
  const [name, setName] = useState("");
  const [actions, setActions] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function setProgress(o: Objective, progress: number) {
    setItems((prev) => prev.map((i) => (i.id === o.id ? { ...i, progress } : i)));
    await api.patch(`/api/objectives/${o.id}`, { progress });
    router.refresh();
  }

  async function remove(id: string) {
    await api.del(`/api/objectives/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className={period === "monthly" ? "main-btn" : "secondary-btn"} onClick={() => setPeriod("monthly")}>
          📅 Du mois
        </button>
        <button className={period === "yearly" ? "main-btn" : "secondary-btn"} onClick={() => setPeriod("yearly")}>
          🗓️ De l’année
        </button>
      </div>

      <form onSubmit={add} style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input className="auth-input" placeholder="Objectif" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="auth-input" placeholder="Actions clés (optionnel)" value={actions} onChange={(e) => setActions(e.target.value)} />
        <button className="main-btn" type="submit" disabled={busy} style={{ justifySelf: "start" }}>
          Ajouter l’objectif
        </button>
      </form>

      {visible.length === 0 ? (
        <EmptyState icon="🎯">Aucun objectif {period === "monthly" ? "du mois" : "de l’année"}.</EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {visible.map((o) => (
            <div key={o.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <strong>{o.name}</strong>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="card-sub">{o.progress}%</span>
                  <button className="secondary-btn" onClick={() => remove(o.id)}>✕</button>
                </div>
              </div>
              {o.actions && <p className="card-sub" style={{ margin: "0 0 6px" }}>{o.actions}</p>}
              <ProgressBar value={o.progress} />
              <input type="range" min={0} max={100} value={o.progress} onChange={(e) => setProgress(o, Number(e.target.value))} style={{ width: "100%", marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
