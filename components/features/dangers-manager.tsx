"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import type { Danger } from "@/types";

export function DangersManager({ initialItems }: { initialItems: Danger[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Danger[]>(initialItems);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [impact, setImpact] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Danger>("/api/dangers", { name, category: category || "Autre", impact });
      setItems((prev) => [...prev, created]);
      setName("");
      setCategory("");
      setImpact(3);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await api.del(`/api/dangers/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="card">
      <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input className="auth-input" style={{ flex: "2 1 180px" }} placeholder="Danger / mauvaise habitude" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="auth-input" style={{ flex: "1 1 120px" }} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
        <select className="auth-input" style={{ flex: "0 1 130px" }} value={impact} onChange={(e) => setImpact(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>Impact {n}</option>
          ))}
        </select>
        <button className="main-btn" type="submit" disabled={busy}>Ajouter</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {items.length === 0 ? (
        <EmptyState icon="🧨">Aucun danger listé. Identifie ce qui te freine.</EmptyState>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((d) => (
            <li key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ flex: 1 }}>{d.name} · <span className="card-sub">{d.category}</span></span>
              <span title="Impact" style={{ color: "var(--danger-soft)" }}>{"▮".repeat(d.impact)}</span>
              <button className="secondary-btn" onClick={() => remove(d.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
