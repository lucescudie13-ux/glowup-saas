"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, percentage } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { FinancialGoal } from "@/types";

export function FinancialGoalsManager({ initialGoals }: { initialGoals: FinancialGoal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = goals.reduce((s, g) => s + Number(g.saved), 0);
  const overallPct = percentage(totalSaved, totalTarget);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    const created = await api.post<FinancialGoal>("/api/financial-goals", { name, target: Number(target), description });
    setGoals((prev) => [...prev, created]);
    setName(""); setTarget(""); setDescription("");
    router.refresh();
  }

  function startEdit(g: FinancialGoal) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditTarget(String(g.target));
    setEditDescription(g.description ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
  }
  async function saveEdit(g: FinancialGoal) {
    const patch = {
      name: editName.trim() || g.name,
      target: Number(editTarget) || g.target,
      description: editDescription,
    };
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...patch } : x))); // optimistic
    setEditingId(null);
    try {
      await api.patch(`/api/financial-goals/${g.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
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
      {/* Prominent combined total — highlights what's LEFT to save */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h2 className="card-title">💰 Reste à épargner</h2>
            <p className="card-sub">Total restant sur l’ensemble de tes objectifs.</p>
          </div>
          <span className="objective-percent" style={{ fontSize: 18 }}>{overallPct}%</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <span className="money-neutral" style={{ fontSize: 32, fontWeight: 800 }}>{money(totalRemaining)}</span>
          <span className="card-sub" style={{ fontSize: 15 }}>restants · {money(totalSaved)} épargnés / {money(totalTarget)}</span>
        </div>
        <div className="big-bar"><div className="big-bar-fill" style={{ width: `${overallPct}%` }} /></div>
        <p className="card-sub" style={{ marginTop: 10 }}>
          {totalRemaining > 0 ? <>{goals.length} objectif(s) en cours.</> : <>🎉 Tous tes objectifs sont atteints !</>}
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">🎯 Objectifs d’épargne</h2>
            <p className="card-sub">Fixe tes objectifs, décris-les et suis ce qu’il te reste à mettre de côté.</p>
          </div>
        </div>
        <form onSubmit={addGoal} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input className="auth-input" style={{ flex: "2 1 180px" }} placeholder="Nom (ex. Vacances, Voiture…)" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 130px" }} type="number" placeholder="Montant cible" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <textarea
            className="auth-input"
            placeholder="Description (optionnel) — Entrée pour aller à la ligne"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            style={{ resize: "vertical" }}
          />
          <button className="checklist-submit" type="submit" style={{ justifySelf: "start" }}>Ajouter l’objectif</button>
        </form>

        {goals.length === 0 ? (
          <EmptyState icon="🐖">Aucun objectif d’épargne. Fixe ton premier objectif.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {goals.map((g) => {
              const pct = percentage(Number(g.saved), Number(g.target));
              return (
                <div className="objective" key={g.id}>
                  {editingId === g.id ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <input className="auth-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom de l’objectif" />
                      <input className="auth-input" type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="Montant cible" style={{ maxWidth: 220 }} />
                      <textarea
                        className="auth-input"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description — Entrée pour aller à la ligne"
                        rows={3}
                        style={{ resize: "vertical" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="checklist-submit" onClick={() => saveEdit(g)} style={{ minWidth: 120 }}>Enregistrer</button>
                        <button type="button" className="ghost-btn" onClick={cancelEdit}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="objective-head">
                        <span className="objective-name">{g.name}</span>
                        <div className="objective-controls" style={{ alignItems: "center" }}>
                          <button type="button" className="task-del" onClick={() => startEdit(g)} aria-label="Modifier" title="Modifier">✏️</button>
                          <button type="button" className="task-del" onClick={() => remove(g.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                        </div>
                      </div>
                      {g.description ? <div className="objective-actions">{g.description}</div> : null}
                      <p className="card-sub" style={{ margin: "6px 0 8px" }}>{money(Number(g.saved))} / {money(Number(g.target))}</p>
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
