"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, percentage } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableList } from "@/components/ui/sortable-list";
import { persistPositions } from "@/lib/reorder";
import type { FinancialGoal } from "@/types";

type Kind = "obligation" | "goal";

interface SectionConfig {
  kind: Kind;
  title: string;
  sub: string;
  summaryTitle: string;
  savedLabel: string;
  addLabel: string;
  namePlaceholder: string;
  emptyIcon: string;
  emptyText: string;
}

const CONFIGS: SectionConfig[] = [
  {
    kind: "obligation",
    title: "📌 Obligations financières",
    sub: "Ce que tu dois payer — prêt, soutien familial… (obligatoire).",
    summaryTitle: "Reste à payer",
    savedLabel: "Déjà payé",
    addLabel: "Ajouter l’obligation",
    namePlaceholder: "Nom (ex. Prêt, Aider maman…)",
    emptyIcon: "📌",
    emptyText: "Aucune obligation. Ajoute ce que tu dois payer.",
  },
  {
    kind: "goal",
    title: "🎯 Objectifs financiers",
    sub: "Ce que tu aimerais t’offrir — pas obligatoire, mais visé.",
    summaryTitle: "Reste à épargner",
    savedLabel: "Épargné",
    addLabel: "Ajouter l’objectif",
    namePlaceholder: "Nom (ex. Vacances, Voiture…)",
    emptyIcon: "🐖",
    emptyText: "Aucun objectif d’épargne. Fixe ton premier objectif.",
  },
];

export function FinancialGoalsManager({ initialGoals }: { initialGoals: FinancialGoal[] }) {
  const router = useRouter();
  const [goals, setGoals] = useState<FinancialGoal[]>(initialGoals);

  async function addGoal(kind: Kind, data: { name: string; target: number; description: string }) {
    const count = goals.filter((g) => (g.kind ?? "goal") === kind).length;
    const created = await api.post<FinancialGoal>("/api/financial-goals", { ...data, kind, position: count });
    setGoals((prev) => [...prev, created]);
    router.refresh();
  }

  function reorder(ordered: FinancialGoal[]) {
    const ids = new Set(ordered.map((g) => g.id));
    setGoals((prev) => [...ordered, ...prev.filter((g) => !ids.has(g.id))]);
    persistPositions("financial-goals", ordered);
  }

  async function patchGoal(g: FinancialGoal, patch: Partial<FinancialGoal>) {
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...patch } : x))); // optimistic
    try {
      await api.patch(`/api/financial-goals/${g.id}`, patch);
      router.refresh();
    } catch {
      router.refresh();
    }
  }

  function setSavedLocal(g: FinancialGoal, saved: number) {
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, saved } : x)));
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
    <div style={{ display: "grid", gap: 16 }}>
      {CONFIGS.map((cfg) => (
        <FinanceSection
          key={cfg.kind}
          config={cfg}
          items={goals.filter((g) => (g.kind ?? "goal") === cfg.kind)}
          onAdd={(data) => addGoal(cfg.kind, data)}
          onPatch={patchGoal}
          onSetSavedLocal={setSavedLocal}
          onRemove={remove}
          onReorder={reorder}
        />
      ))}
    </div>
  );
}

function FinanceSection({
  config,
  items,
  onAdd,
  onPatch,
  onSetSavedLocal,
  onRemove,
  onReorder,
}: {
  config: SectionConfig;
  items: FinancialGoal[];
  onAdd: (data: { name: string; target: number; description: string }) => void;
  onPatch: (g: FinancialGoal, patch: Partial<FinancialGoal>) => void;
  onSetSavedLocal: (g: FinancialGoal, saved: number) => void;
  onRemove: (id: string) => void;
  onReorder: (ordered: FinancialGoal[]) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});

  const totalTarget = items.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = items.reduce((s, g) => s + Number(g.saved), 0);
  const overallPct = percentage(totalSaved, totalTarget);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    onAdd({ name: name.trim(), target: Number(target), description });
    setName(""); setTarget(""); setDescription("");
  }

  function startEdit(g: FinancialGoal) {
    setEditingId(g.id);
    setEditName(g.name);
    setEditTarget(String(g.target));
    setEditDescription(g.description ?? "");
  }
  function saveEdit(g: FinancialGoal) {
    onPatch(g, { name: editName.trim() || g.name, target: Number(editTarget) || g.target, description: editDescription });
    setEditingId(null);
  }
  function addAmount(g: FinancialGoal) {
    const inc = Number(addAmounts[g.id]);
    if (!inc) return;
    const saved = Math.max(0, Number(g.saved) + inc);
    setAddAmounts((prev) => ({ ...prev, [g.id]: "" }));
    onPatch(g, { saved });
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2 className="card-title">{config.title}</h2>
          <p className="card-sub">{config.sub}</p>
        </div>
        <span className="objective-percent" style={{ fontSize: 18 }}>{overallPct}%</span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="money-neutral" style={{ fontSize: 26, fontWeight: 800 }}>{money(totalRemaining)}</span>
        <span className="card-sub">{config.summaryTitle.toLowerCase()} · {money(totalSaved)} / {money(totalTarget)}</span>
      </div>
      <div className="big-bar" style={{ marginBottom: 16 }}><div className="big-bar-fill" style={{ width: `${overallPct}%` }} /></div>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="auth-input" style={{ flex: "2 1 180px" }} placeholder={config.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
          <input className="auth-input" style={{ flex: "1 1 130px" }} type="number" placeholder="Montant total" value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <textarea className="auth-input" placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ resize: "vertical" }} />
        <button className="checklist-submit" type="submit" style={{ justifySelf: "start" }}>{config.addLabel}</button>
      </form>

      {items.length === 0 ? (
        <EmptyState icon={config.emptyIcon}>{config.emptyText}</EmptyState>
      ) : (
        <SortableList items={items} onReorder={onReorder} gap={18}>
          {(g) => {
            const pct = percentage(Number(g.saved), Number(g.target));
            return (
              <div className="objective">
                {editingId === g.id ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    <input className="auth-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom" />
                    <input className="auth-input" type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} placeholder="Montant total" style={{ maxWidth: 220 }} />
                    <textarea className="auth-input" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={3} style={{ resize: "vertical" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="checklist-submit" onClick={() => saveEdit(g)} style={{ minWidth: 120 }}>Enregistrer</button>
                      <button type="button" className="ghost-btn" onClick={() => setEditingId(null)}>Annuler</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="objective-head">
                      <span className="objective-name">{g.name}</span>
                      <div className="objective-controls" style={{ alignItems: "center" }}>
                        <button type="button" className="task-del" onClick={() => startEdit(g)} aria-label="Modifier" title="Modifier">✏️</button>
                        <button type="button" className="task-del" onClick={() => onRemove(g.id)} aria-label="Supprimer" title="Supprimer">✕</button>
                      </div>
                    </div>
                    {g.description ? <div className="objective-actions">{g.description}</div> : null}
                    <p className="card-sub" style={{ margin: "6px 0 8px" }}>{money(Number(g.saved))} / {money(Number(g.target))}</p>
                    <div className="objective-progress-line">
                      <div className="big-bar"><div className="big-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <span className="objective-percent">{pct}%</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 10 }}>
                      <div>
                        <label className="field-label">Ajouter un montant</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            className="auth-input"
                            type="number"
                            inputMode="decimal"
                            placeholder="+ montant"
                            style={{ maxWidth: 140 }}
                            value={addAmounts[g.id] ?? ""}
                            onChange={(e) => setAddAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmount(g); } }}
                          />
                          <button type="button" className="checklist-submit" onClick={() => addAmount(g)} style={{ minWidth: 90 }}>+ Ajouter</button>
                        </div>
                      </div>
                      <div>
                        <label className="field-label">{config.savedLabel} (total)</label>
                        <input
                          className="auth-input"
                          type="number"
                          style={{ maxWidth: 140 }}
                          value={g.saved}
                          onChange={(e) => onSetSavedLocal(g, Number(e.target.value))}
                          onBlur={(e) => onPatch(g, { saved: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          }}
        </SortableList>
      )}
    </div>
  );
}
