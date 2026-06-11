"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, percentage } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import type { FinancialGoal } from "@/types";

export function FinancialGoalsManager({ initialGoals }: { initialGoals: FinancialGoal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved), 0);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    const created = await api.post<FinancialGoal>("/api/financial-goals", { name, target: Number(target) });
    setGoals((prev) => [...prev, created]);
    setName(""); setTarget("");
    router.refresh();
  }

  // Optimistic local update; persist on blur.
  function changeSaved(g: FinancialGoal, saved: number) {
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, saved } : x)));
  }
  async function commitSaved(g: FinancialGoal, saved: number) {
    try {
      await api.patch(`/api/financial-goals/${g.id}`, { saved });
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  async function remove(id: string) {
    const snapshot = goals;
    setGoals((prev) => prev.filter((g) => g.id !== id)); // optimistic
    try {
      await api.del(`/api/financial-goals/${id}`);
      router.refresh();
    } catch {
      setGoals(snapshot);
    }
  }

  return (
    <>
      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Épargne totale</div>
          <div className="kpi-value money-positive">{money(totalSaved)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Objectif total</div>
          <div className="kpi-value">{money(totalTarget)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Progression globale</div>
          <div className="kpi-value">{percentage(totalSaved, totalTarget)}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">🎯 Objectifs d’épargne</h2>
            <p className="card-sub">Fixe tes objectifs et suis ce que tu as déjà mis de côté.</p>
          </div>
        </div>
        <form onSubmit={addGoal} className="checklist-add">
          <input className="auth-input" style={{ flex: "2 1 180px" }} placeholder="Nom (ex. Vacances, Voiture…)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 130px" }} type="number" placeholder="Montant cible" value={target} onChange={(e) => setTarget(e.target.value)} />
          <button className="checklist-submit" type="submit">Ajouter</button>
        </form>

        {goals.length === 0 ? (
          <EmptyState icon="🐖">Aucun objectif d’épargne. Fixe ton premier objectif.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {goals.map((g) => {
              const pct = percentage(Number(g.saved), Number(g.target));
              return (
                <div className="objective" key={g.id}>
                  <div className="objective-head">
                    <span className="objective-name">{g.name}</span>
                    <div className="objective-controls" style={{ alignItems: "center" }}>
                      <span className="card-sub">{money(Number(g.saved))} / {money(Number(g.target))}</span>
                      <button type="button" className="task-del" onClick={() => remove(g.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                    </div>
                  </div>
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="big-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="objective-percent">{pct}%</span>
                  </div>
                  <label className="field-label" style={{ marginTop: 10 }}>Montant épargné</label>
                  <input
                    className="auth-input"
                    type="number"
                    style={{ maxWidth: 220 }}
                    value={g.saved}
                    onChange={(e) => changeSaved(g, Number(e.target.value))}
                    onBlur={(e) => commitSaved(g, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
