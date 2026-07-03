"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { STAT_CATEGORIES, ENERGY_CATEGORY } from "@/lib/constants";
import type { Stat } from "@/types";

interface RecordResult {
  action: { id: string; name: string };
  stats: Stat[];
  streak: number;
  xpGained: number;
  xp: number;
  level: number;
  leveledUp: boolean;
}

/** A compact −/value/+ stepper for one stat adjustment. */
function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(-20, Math.min(20, v));
  return (
    <div className="stepper" role="group">
      <button type="button" className="stepper-btn" aria-label="Diminuer" onClick={() => onChange(clamp(value - 1))}>−</button>
      <span className="stepper-val">{value > 0 ? `+${value}` : value}</span>
      <button type="button" className="stepper-btn" aria-label="Augmenter" onClick={() => onChange(clamp(value + 1))}>+</button>
    </div>
  );
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

  const adjusted = useMemo(() => Object.values(deltas).filter((v) => v !== 0).length, [deltas]);

  function reset() {
    setDeltas({});
    setFlash(null);
    setError(null);
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
      const xpPart = res.xpGained > 0 ? ` · +${res.xpGained} XP` : "";
      setFlash(
        res.leveledUp
          ? `🎉 Niveau ${res.level} atteint !${xpPart} · série ${res.streak} j 🔥`
          : `Action enregistrée${xpPart} · série ${res.streak} j 🔥`,
      );
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
        <div>
          <h2 className="card-title">⚡ Enregistrer une action</h2>
          <span className="card-sub">Nomme ton action, puis ajuste les stats concernées avec − / +.</span>
        </div>
      </div>

      <form onSubmit={submit}>
        <input
          className="auth-input"
          placeholder="Nom de l’action (ex. Séance de sport)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div className="action-cats">
          {[...STAT_CATEGORIES, ENERGY_CATEGORY].map((cat) => {
            const group = stats.filter((s) => s.category === cat.key);
            if (group.length === 0) return null;
            return (
              <section key={cat.key} className="action-cat">
                <div className="action-cat-head">{cat.icon} {cat.label}</div>
                <div className="stepper-grid">
                  {group.map((s) => {
                    const v = deltas[s.key] ?? 0;
                    return (
                      <div key={s.id} className={`stepper-row${v !== 0 ? " is-active" : ""}`}>
                        <span className="stepper-name" title={s.name}>{s.name}</span>
                        <Stepper value={v} onChange={(next) => setDelta(s.key, next)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {error && <p className="auth-error" style={{ marginTop: 12 }}>{error}</p>}
        {flash && <p style={{ color: "var(--success)", fontSize: 14, marginTop: 12 }}>{flash}</p>}

        <div className="action-footer">
          <span className="card-sub">
            {adjusted === 0 ? "Aucune stat ajustée" : `${adjusted} stat${adjusted > 1 ? "s" : ""} ajustée${adjusted > 1 ? "s" : ""}`}
          </span>
          <div className="action-footer-btns">
            {adjusted > 0 && (
              <button type="button" className="secondary-btn" onClick={reset} disabled={busy}>Réinitialiser</button>
            )}
            <button className="main-btn action-submit" type="submit" disabled={busy || !name.trim() || adjusted === 0}>
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
