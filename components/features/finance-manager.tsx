"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoHint } from "@/components/ui/info-hint";
import { SortableList } from "@/components/ui/sortable-list";
import { persistPositions } from "@/lib/reorder";
import type { FinanceEntry, FinanceType } from "@/types";

interface Props {
  initialEntries: FinanceEntry[];
  /** Monthly saving needed to reach every dated financial goal on time. */
  goalsMonthlyNeed?: number;
}

/** One recurring section (revenus OR dépenses) — mirror layout. */
function RecurringSection({
  kind,
  title,
  icon,
  sub,
  placeholder,
  defaultCategory,
  items,
  total,
  onAdd,
  onRemove,
  onReorder,
  onPatch,
}: {
  kind: FinanceType;
  title: string;
  icon: string;
  sub: string;
  placeholder: string;
  defaultCategory: string;
  items: FinanceEntry[];
  total: number;
  onAdd: (kind: FinanceType, data: { name: string; amount: number; category: string }) => void;
  onRemove: (id: string) => void;
  onReorder: (kind: FinanceType, ordered: FinanceEntry[]) => void;
  onPatch: (id: string, data: Partial<FinanceEntry>) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", amount: "", category: "" });
  const positive = kind === "income";

  function startEdit(e: FinanceEntry) {
    setEditingId(e.id);
    setEditDraft({ name: e.name, amount: String(e.amount), category: e.category ?? "" });
  }
  function saveEdit(e: FinanceEntry) {
    onPatch(e.id, {
      name: editDraft.name.trim() || e.name,
      amount: Number(editDraft.amount) || Number(e.amount),
      category: editDraft.category || e.category,
    });
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    onAdd(kind, { name: name.trim(), amount: Number(amount), category: category || defaultCategory });
    setName(""); setAmount(""); setCategory("");
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">{icon} {title}</h2>
          <p className="card-sub">{sub}</p>
        </div>
        <span className="pill">{money(total)} / mois</span>
      </div>
      <form onSubmit={submit} className="checklist-add">
        <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder={placeholder} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="auth-input" style={{ flex: "1 1 100px" }} type="number" step="0.01" placeholder="Montant" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="auth-input" style={{ flex: "1 1 120px" }} placeholder="Catégorie" value={category} onChange={(e) => setCategory(e.target.value)} />
        <button className="checklist-submit" type="submit">Ajouter</button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={icon}>{positive ? "Aucun revenu récurrent." : "Aucune dépense récurrente."}</EmptyState>
      ) : (
        <SortableList items={items} onReorder={(o) => onReorder(kind, o)} gap={8}>
          {(e) => (
            editingId === e.id ? (
              <div className="task-item" style={{ display: "grid", gap: 6 }}>
                <input className="auth-input" value={editDraft.name} onChange={(ev) => setEditDraft((s) => ({ ...s, name: ev.target.value }))} placeholder="Libellé" autoFocus />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input className="auth-input" type="number" step="0.01" style={{ width: 110 }} value={editDraft.amount} onChange={(ev) => setEditDraft((s) => ({ ...s, amount: ev.target.value }))} placeholder="Montant" />
                  <input className="auth-input" style={{ flex: "1 1 120px" }} value={editDraft.category} onChange={(ev) => setEditDraft((s) => ({ ...s, category: ev.target.value }))} placeholder="Catégorie" />
                  <button type="button" className="checklist-submit" onClick={() => saveEdit(e)}>OK</button>
                  <button type="button" className="secondary-btn" onClick={() => setEditingId(null)}>Annuler</button>
                </div>
              </div>
            ) : (
              <div className="task-item">
                <div className="task-body">
                  <span className="task-name">{e.name}</span>
                  <div className="task-meta">
                    <span className="cat-tag">{e.category}</span>
                    <span className="task-mins">/ mois</span>
                  </div>
                </div>
                <strong className={positive ? "money-positive" : "money-negative"}>
                  {positive ? "+" : "−"}{money(Number(e.amount))}
                </strong>
                <button type="button" className="task-del" onClick={() => startEdit(e)} aria-label="Modifier" title="Modifier">✏️</button>
                <button type="button" className="task-del" onClick={() => onRemove(e.id)} aria-label="Supprimer" title="Supprimer">✕</button>
              </div>
            )
          )}
        </SortableList>
      )}
    </div>
  );
}

export function FinanceManager({ initialEntries, goalsMonthlyNeed = 0 }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<FinanceEntry[]>(initialEntries);

  const recurring = entries.filter((e) => e.recurring && !e.planned);
  const incomes = recurring.filter((e) => e.type === "income");
  const expenses = recurring.filter((e) => e.type === "expense");
  const incomeTotal = incomes.reduce((s, e) => s + Number(e.amount), 0);
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const net = incomeTotal - expenseTotal;
  const netAfterGoals = net - goalsMonthlyNeed;

  async function addEntry(kind: FinanceType, data: { name: string; amount: number; category: string }) {
    const count = recurring.filter((e) => e.type === kind).length;
    const created = await api.post<FinanceEntry>("/api/finance-entries", { type: kind, recurring: true, position: count, ...data });
    setEntries((prev) => [...prev, created]);
    router.refresh();
  }

  function reorder(kind: FinanceType, ordered: FinanceEntry[]) {
    const orderedIds = new Set(ordered.map((e) => e.id));
    setEntries((prev) => [...ordered, ...prev.filter((e) => !orderedIds.has(e.id))]);
    persistPositions("finance-entries", ordered);
  }

  async function patchEntry(id: string, data: Partial<FinanceEntry>) {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e))); // optimistic
    try {
      await api.patch(`/api/finance-entries/${id}`, data);
      router.refresh();
    } catch {
      router.refresh();
    }
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
      {/* ===== Résultat mensuel — mis en avant (2 montants) ===== */}
      <div className="budget-results" style={{ marginBottom: 16 }}>
        <div className={`budget-result ${net >= 0 ? "is-pos" : "is-neg"}`}>
          <div className="card-sub">
            Résultat mensuel <InfoHint text="Tes revenus récurrents moins tes dépenses récurrentes, chaque mois." />
          </div>
          <div className={net >= 0 ? "money-positive" : "money-negative"} style={{ fontSize: 36, fontWeight: 800, margin: "4px 0" }}>
            {money(net)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
            <span className="card-sub">Revenus <strong className="money-positive">{money(incomeTotal)}</strong></span>
            <span className="card-sub">Dépenses <strong className="money-negative">{money(expenseTotal)}</strong></span>
            <span className="card-sub">{net >= 0 ? "Surplus 🎉" : "Déficit"}</span>
          </div>
        </div>

        {goalsMonthlyNeed > 0 && (
          <div className={`budget-result ${netAfterGoals >= 0 ? "is-pos" : "is-neg"}`}>
            <div className="card-sub">
              Après épargne objectifs
              <InfoHint text="Ce qu'il te reste après avoir mis de côté chaque mois le montant nécessaire pour atteindre tes objectifs financiers datés à temps." />
            </div>
            <div className={netAfterGoals >= 0 ? "money-positive" : "money-negative"} style={{ fontSize: 36, fontWeight: 800, margin: "4px 0" }}>
              {money(netAfterGoals)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 18, flexWrap: "wrap" }}>
              <span className="card-sub">Épargne objectifs <strong className="money-negative">−{money(goalsMonthlyNeed)}/mois</strong></span>
              <span className="card-sub">{netAfterGoals >= 0 ? "Objectifs finançables ✅" : "Budget insuffisant ⚠️"}</span>
            </div>
          </div>
        )}
      </div>

      <RecurringSection
        kind="income"
        title="Revenus récurrents"
        icon="💵"
        sub="Salaire, rentes, revenus réguliers… comptés chaque mois."
        placeholder="Ex. Salaire, Loyer perçu…"
        defaultCategory="Revenu"
        items={incomes}
        total={incomeTotal}
        onAdd={addEntry}
        onRemove={removeEntry}
        onReorder={reorder}
        onPatch={patchEntry}
      />

      <RecurringSection
        kind="expense"
        title="Dépenses récurrentes"
        icon="🔁"
        sub="Loyer, abonnements, assurances… comptés chaque mois."
        placeholder="Ex. Loyer, Netflix…"
        defaultCategory="Abonnement"
        items={expenses}
        total={expenseTotal}
        onAdd={addEntry}
        onRemove={removeEntry}
        onReorder={reorder}
        onPatch={patchEntry}
      />
    </>
  );
}
