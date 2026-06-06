"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/utils";
import type { Action } from "@/types";

export function HistoryList({ initialItems }: { initialItems: Action[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Action[]>(initialItems);
  const [confirming, setConfirming] = useState(false);

  async function removeOne(id: string) {
    await api.del(`/api/actions/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  async function clearAll() {
    await api.del("/api/actions");
    setItems([]);
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">📜 Journal des actions</h2>
        {items.length > 0 &&
          (confirming ? (
            <span style={{ display: "flex", gap: 8 }}>
              <button className="secondary-btn" onClick={() => setConfirming(false)}>Annuler</button>
              <button className="main-btn" onClick={clearAll}>Confirmer</button>
            </span>
          ) : (
            <button className="secondary-btn" onClick={() => setConfirming(true)}>Tout effacer</button>
          ))}
      </div>

      {items.length === 0 ? (
        <EmptyState icon="📜">Aucune action enregistrée pour l’instant.</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((a) => {
            const deltas = (a.deltas as Record<string, number>) ?? {};
            return (
              <li key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div>{a.name}</div>
                  <div className="card-sub" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    {Object.entries(deltas).map(([k, v]) => (
                      <span key={k} style={{ color: v >= 0 ? "var(--success)" : "var(--danger-soft)" }}>
                        {k} {v >= 0 ? "+" : ""}{v}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="card-sub">{formatRelative(a.created_at)}</span>
                <button className="secondary-btn" onClick={() => removeOne(a.id)}>✕</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
