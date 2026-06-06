"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { ACTION_PRESETS } from "@/lib/constants";
import type { Stat } from "@/types";

interface RecordResult {
  action: { id: string; name: string };
  stats: Stat[];
  streak: number;
}

export function ActionRecorder({ stats }: { stats: Stat[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [deltas, setDeltas] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  function setDelta(key: string, value: number) {
    setDeltas((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(presetKey: string) {
    const preset = ACTION_PRESETS[presetKey];
    if (!preset) return;
    setName(preset.name);
    setDeltas({ ...preset.deltas });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const nonZero = Object.fromEntries(Object.entries(deltas).filter(([, v]) => v !== 0));
    if (!name.trim() || Object.keys(nonZero).length === 0) {
      setError("Donne un nom et au moins un ajustement de statistique.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<RecordResult>("/api/actions", { name, deltas: nonZero });
      setFlash(`Action enregistrée · série ${res.streak} j 🔥`);
      setName("");
      setDeltas({});
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">⚡ Enregistrer une action</h2>
        <span className="card-sub">Fais bouger tes statistiques</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {Object.keys(ACTION_PRESETS).map((p) => (
          <button key={p} type="button" className="secondary-btn" onClick={() => applyPreset(p)}>
            {p}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <input
          className="auth-input"
          placeholder="Nom de l’action (ex: Séance de sport)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        <div className="delta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
          {stats.map((s) => (
            <label key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{s.name}</span>
              <input
                type="number"
                className="auth-input"
                style={{ width: 80, padding: "6px 8px" }}
                value={deltas[s.key] ?? 0}
                onChange={(e) => setDelta(s.key, Number(e.target.value))}
              />
            </label>
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}
        {flash && <p style={{ color: "var(--success)", fontSize: 14 }}>{flash}</p>}

        <button className="main-btn" type="submit" disabled={busy} style={{ marginTop: 14 }}>
          {busy ? "Enregistrement…" : "Enregistrer l’action"}
        </button>
      </form>
    </div>
  );
}
