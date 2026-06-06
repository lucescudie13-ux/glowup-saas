"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, todayISO } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import type { FinanceEntry, FinancialGoal, FinanceType } from "@/types";

interface Props {
  initialEntries: FinanceEntry[];
  initialGoals: FinancialGoal[];
}

export function FinanceManager({ initialEntries, initialGoals }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<FinanceEntry[]>(initialEntries);
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);

  const [type, setType] = useState<FinanceType>("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  const month = todayISO().slice(0, 7);
  const inMonth = entries.filter((e) => e.entry_date.slice(0, 7) === month);
  const income = inMonth.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const spent = inMonth.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    const created = await api.post<FinanceEntry>("/api/finance-entries", {
      type, name, amount: Number(amount), category: category || "Autre",
    });
    setEntries((prev) => [created, ...prev]);
    setName(""); setAmount(""); setCategory("");
    router.refresh();
  }

  async function removeEntry(id: string) {
    await api.del(`/api/finance-entries/${id}`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    router.refresh();
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget) return;
    const created = await api.post<FinancialGoal>("/api/financial-goals", {
      name: goalName, target: Number(goalTarget),
    });
    setGoals((prev) => [...prev, created]);
    setGoalName(""); setGoalTarget("");
    router.refresh();
  }

  async function updateSaved(g: FinancialGoal, saved: number) {
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, saved } : x)));
    await api.patch(`/api/financial-goals/${g.id}`, { saved });
    router.refresh();
  }

  async function removeGoal(id: string) {
    await api.del(`/api/financial-goals/${id}`);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    router.refresh();
  }

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card"><div className="kpi-label">Revenus du mois</div><div className="kpi-value">{money(income)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Dépenses du mois</div><div className="kpi-value">{money(spent)}</div></div>
        <div className="kpi-card"><div className="kpi-label">Solde net</div><div className="kpi-value">{money(income - spent)}</div></div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h2 className="card-title">💸 Mouvements</h2></div>
        <form onSubmit={addEntry} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <select className="auth-input" style={{ flex: "0 1 120px" }} value={type} onChange={(e) => setType(e.target.value as FinanceType)}>
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Libellé" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 120px" }} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
          <button className="main-btn" type="submit">Ajouter</button>
        </form>

        {entries.length === 0 ? (
          <EmptyState icon="💰">Aucun mouvement enregistré.</EmptyState>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {entries.slice(0, 30).map((e) => (
              <li key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
                <span style={{ flex: 1 }}>{e.name} <span className="card-sub">· {e.category}</span></span>
                <span style={{ color: e.type === "income" ? "var(--success)" : "var(--danger-soft)" }}>
                  {e.type === "income" ? "+" : "−"}{money(Number(e.amount))}
                </span>
                <button className="secondary-btn" onClick={() => removeEntry(e.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div className="card-head"><h2 className="card-title">🎯 Objectifs d’épargne</h2></div>
        <form onSubmit={addGoal} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Nom" value={goalName} onChange={(e) => setGoalName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 120px" }} type="number" placeholder="Montant cible" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} />
          <button className="main-btn" type="submit">Ajouter</button>
        </form>
        {goals.length === 0 ? (
          <EmptyState icon="🐖">Aucun objectif d’épargne.</EmptyState>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {goals.map((g) => (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong>{g.name}</strong>
                  <span className="card-sub">{money(Number(g.saved))} / {money(Number(g.target))}</span>
                </div>
                <ProgressBar value={Number(g.target) ? (Number(g.saved) / Number(g.target)) * 100 : 0} />
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                  <input className="auth-input" type="number" style={{ flex: 1 }} defaultValue={g.saved} onBlur={(e) => updateSaved(g, Number(e.target.value))} />
                  <button className="secondary-btn" onClick={() => removeGoal(g.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
