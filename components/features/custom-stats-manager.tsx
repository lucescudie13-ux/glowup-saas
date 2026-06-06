"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { Stat } from "@/types";

export function CustomStatsManager({ stats }: { stats: Stat[] }) {
  const router = useRouter();
  const [custom, setCustom] = useState<Stat[]>(stats.filter((s) => s.is_custom));
  const [name, setName] = useState("");
  const [value, setValue] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Stat>("/api/stats", { name, value });
      setCustom((prev) => [...prev, created]);
      setName("");
      setValue(50);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api.del(`/api/stats/${id}`);
      setCustom((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h2 className="card-title">✨ Statistiques personnalisées</h2>
        <span className="card-sub">Ajoute tes propres caractéristiques</span>
      </div>

      <form onSubmit={add} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <input
          className="auth-input"
          style={{ flex: "2 1 180px" }}
          placeholder="Nom de la stat (ex: Créativité)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="auth-input"
          style={{ flex: "0 1 110px" }}
          type="number"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
        <button className="main-btn" type="submit" disabled={busy}>Ajouter</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      {custom.length === 0 ? (
        <p className="card-sub">Aucune stat personnalisée pour l’instant. Les 8 stats par défaut ne sont pas supprimables.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {custom.map((s) => (
            <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
              <span style={{ flex: 1 }}>{s.name}</span>
              <span className="card-sub">{s.value}/100</span>
              <button className="secondary-btn" onClick={() => remove(s.id)} aria-label="Supprimer">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
