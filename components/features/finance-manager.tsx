"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, todayISO } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import type { FinanceEntry, FinanceType } from "@/types";

interface Props {
  initialEntries: FinanceEntry[];
}

export function FinanceManager({ initialEntries }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<FinanceEntry[]>(initialEntries);

  // One-off movement form
  const [type, setType] = useState<FinanceType>("expense");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  // Recurring expense form
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recCategory, setRecCategory] = useState("");

  const month = todayISO().slice(0, 7);
  const oneOff = entries.filter((e) => !e.recurring);
  const recurring = entries.filter((e) => e.recurring);

  const monthOneOff = oneOff.filter((e) => e.entry_date.slice(0, 7) === month);
  const income = monthOneOff.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const oneOffSpent = monthOneOff.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const recurringSpent = recurring.reduce((s, e) => s + Number(e.amount), 0);
  const spent = oneOffSpent + recurringSpent;
  const net = income - spent;

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

  async function addRecurring(e: React.FormEvent) {
    e.preventDefault();
    if (!recName.trim() || !recAmount) return;
    const created = await api.post<FinanceEntry>("/api/finance-entries", {
      type: "expense", name: recName, amount: Number(recAmount), category: recCategory || "Abonnement", recurring: true,
    });
    setEntries((prev) => [created, ...prev]);
    setRecName(""); setRecAmount(""); setRecCategory("");
    router.refresh();
  }

  async function removeEntry(id: string) {
    const snapshot = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id)); // optimistic
    try {
      await api.del(`/api/finance-entries/${id}`);
      router.refresh();
    } catch {
      setEntries(snapshot);
    }
  }

  return (
    <>
      {/* ===== Synthèse du mois ===== */}
      <div className="grid grid-stats" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="kpi-label">Revenus du mois</div>
          <div className="kpi-value money-positive">{money(income)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Dépenses du mois</div>
          <div className="kpi-value money-negative">{money(spent)}</div>
          <div className="kpi-trend">dont {money(recurringSpent)} récurrentes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Résultat du mois</div>
          <div className={`kpi-value ${net >= 0 ? "money-positive" : "money-negative"}`}>{money(net)}</div>
          <div className="kpi-trend">{net >= 0 ? "Surplus 🎉" : "Déficit"}</div>
        </div>
      </div>

      {/* ===== Mouvements ponctuels ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h2 className="card-title">💸 Mouvements</h2>
            <p className="card-sub">Revenus et dépenses ponctuels du mois.</p>
          </div>
        </div>
        <form onSubmit={addEntry} className="checklist-add">
          <select className="auth-input" style={{ flex: "0 1 120px" }} value={type} onChange={(e) => setType(e.target.value as FinanceType)}>
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Libellé" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 120px" }} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
          <button className="checklist-submit" type="submit">Ajouter</button>
        </form>

        {monthOneOff.length === 0 ? (
          <EmptyState icon="💰">Aucun mouvement ce mois-ci.</EmptyState>
        ) : (
          <ul className="checklist">
            {oneOff.slice(0, 40).map((e) => (
              <li key={e.id} className="task-item">
                <div className="task-body">
                  <span className="task-name">{e.name}</span>
                  <div className="task-meta"><span className="cat-tag">{e.category}</span></div>
                </div>
                <strong className={e.type === "income" ? "money-positive" : "money-negative"}>
                  {e.type === "income" ? "+" : "−"}{money(Number(e.amount))}
                </strong>
                <button type="button" className="task-del" onClick={() => removeEntry(e.id)} aria-label="Supprimer" title="Supprimer">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ===== Dépenses récurrentes ===== */}
      <div className="card">
        <div className="card-head">
          <div>
            <h2 className="card-title">🔁 Dépenses récurrentes</h2>
            <p className="card-sub">Loyer, abonnements, assurances… comptés automatiquement chaque mois.</p>
          </div>
          <span className="pill">{money(recurringSpent)} / mois</span>
        </div>
        <form onSubmit={addRecurring} className="checklist-add">
          <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder="Ex. Loyer, Netflix…" value={recName} onChange={(e) => setRecName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Montant" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 120px" }} placeholder="Catégorie" value={recCategory} onChange={(e) => setRecCategory(e.target.value)} />
          <button className="checklist-submit" type="submit">Ajouter</button>
        </form>

        {recurring.length === 0 ? (
          <EmptyState icon="🔁">Aucune dépense récurrente. Ajoute ton loyer ou tes abonnements.</EmptyState>
        ) : (
          <ul className="checklist">
            {recurring.map((e) => (
              <li key={e.id} className="task-item">
                <div className="task-body">
                  <span className="task-name">{e.name}</span>
                  <div className="task-meta">
                    <span className="cat-tag">{e.category}</span>
                    <span className="task-mins">/ mois</span>
                  </div>
                </div>
                <strong className="money-negative">−{money(Number(e.amount))}</strong>
                <button type="button" className="task-del" onClick={() => removeEntry(e.id)} aria-label="Supprimer" title="Supprimer">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
