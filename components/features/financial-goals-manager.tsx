"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { money, percentage, monthlySavingNeeded, formatDayLabel, todayISO } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { InfoHint } from "@/components/ui/info-hint";
import { ImagePicker } from "@/components/ui/image-picker";
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

  async function addGoal(kind: Kind, data: { name: string; target: number; description: string; deadline: string | null; image: string }) {
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
  onRemove,
  onReorder,
}: {
  config: SectionConfig;
  items: FinancialGoal[];
  onAdd: (data: { name: string; target: number; description: string; deadline: string | null; image: string }) => void;
  onPatch: (g: FinancialGoal, patch: Partial<FinancialGoal>) => void;
  onRemove: (id: string) => void;
  onReorder: (ordered: FinancialGoal[]) => void;
}) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [image, setImage] = useState("");
  const [editing, setEditing] = useState(false);
  const [addAmounts, setAddAmounts] = useState<Record<string, string>>({});

  const totalTarget = items.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = items.reduce((s, g) => s + Number(g.saved), 0);
  const overallPct = percentage(totalSaved, totalTarget);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !target) return;
    onAdd({ name: name.trim(), target: Number(target), description, deadline: deadline || null, image });
    setName(""); setTarget(""); setDescription(""); setDeadline(""); setImage("");
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="objective-percent" style={{ fontSize: 18 }}>{overallPct}%</span>
          {items.length > 0 && (
            <button type="button" className={`secondary-btn${editing ? " active" : ""}`} style={{ minHeight: 36 }} onClick={() => setEditing((v) => !v)}>
              {editing ? "✓ Terminé" : "✏️ Modifier"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <span className="money-neutral" style={{ fontSize: 26, fontWeight: 800 }}>Restant : {money(totalRemaining)}</span>
        <span className="card-sub">{money(totalSaved)} / {money(totalTarget)}</span>
      </div>
      <div className="big-bar" style={{ marginBottom: 16 }}><div className="big-bar-fill" style={{ width: `${overallPct}%` }} /></div>

      {editing && (
        <p className="card-sub" style={{ margin: "0 0 12px" }}>
          Glisse par la poignée pour réordonner · modifie les champs · ajoute-en un nouveau ci-dessous.
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState icon={config.emptyIcon}>{config.emptyText}</EmptyState>
      ) : editing ? (
        /* ----- Edit / organise mode: reorder + inline-edit + delete ----- */
        <SortableList items={items} onReorder={onReorder} gap={12}>
          {(g) => (
            <div className="objective fin-edit-row">
              <div style={{ display: "grid", gap: 8 }}>
                <input
                  className="auth-input"
                  defaultValue={g.name}
                  key={`n-${g.id}`}
                  placeholder="Nom"
                  onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== g.name) onPatch(g, { name: v }); }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    className="auth-input"
                    type="number"
                    defaultValue={String(g.target)}
                    key={`t-${g.id}`}
                    placeholder="Montant total"
                    style={{ flex: "1 1 120px" }}
                    onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v !== Number(g.target)) onPatch(g, { target: v }); }}
                  />
                  <input
                    className="auth-input"
                    type="number"
                    defaultValue={String(g.saved)}
                    key={`s-${g.id}`}
                    placeholder={config.savedLabel}
                    style={{ flex: "1 1 120px" }}
                    onBlur={(e) => { const v = Math.max(0, Number(e.target.value)); if (v !== Number(g.saved)) onPatch(g, { saved: v }); }}
                  />
                  <input
                    className="auth-input"
                    type="date"
                    defaultValue={g.deadline ?? ""}
                    key={`d-${g.id}`}
                    style={{ flex: "1 1 150px" }}
                    onChange={(e) => onPatch(g, { deadline: e.target.value || null })}
                  />
                </div>
                <textarea
                  className="auth-input"
                  defaultValue={g.description ?? ""}
                  key={`de-${g.id}`}
                  placeholder="Description (optionnel)"
                  rows={2}
                  style={{ resize: "vertical" }}
                  onBlur={(e) => { if (e.target.value !== (g.description ?? "")) onPatch(g, { description: e.target.value }); }}
                />
                <div className="goal-photo-row">
                  <ImagePicker value={g.image ?? ""} onChange={(url) => onPatch(g, { image: url })} alt={g.name} />
                  <span className="card-sub">Photo de l’objectif</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button" className="ghost-btn" onClick={() => onRemove(g.id)}>🗑 Supprimer</button>
                </div>
              </div>
            </div>
          )}
        </SortableList>
      ) : (
        /* ----- Normal mode: read + contribute (clean, no per-row buttons) ----- */
        <div className="grid grid-2" style={{ alignItems: "start" }}>
          {items.map((g) => {
            const pct = percentage(Number(g.saved), Number(g.target));
            const remaining = Math.max(0, Number(g.target) - Number(g.saved));
            const need = monthlySavingNeeded(remaining, g.deadline);
            return (
              <div className="objective" key={g.id}>
                {g.image ? <img src={g.image} alt={g.name} className="goal-image" /> : null}
                <div className="objective-head">
                  <span className="objective-name">{g.name}</span>
                  <span className="card-sub">{money(Number(g.saved))} / {money(Number(g.target))}</span>
                </div>
                {g.description ? <div className="objective-actions">{g.description}</div> : null}
                <div className="objective-progress-line">
                  <div className="big-bar"><div className="big-bar-fill" style={{ width: `${pct}%` }} /></div>
                  <span className="objective-percent">{pct}%</span>
                </div>
                {g.deadline ? (
                  <div className="fin-deadline">
                    🗓️ Échéance {formatDayLabel(g.deadline)}
                    {need > 0 ? <> · <strong>{money(need)}/mois</strong> pour y arriver à temps</> : <> · objectif atteint 🎉</>}
                  </div>
                ) : null}
                <div className="fin-addamount">
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
            );
          })}
        </div>
      )}

      {/* Add form — compact: fields on rows, photo as a small inline button */}
      {(editing || items.length === 0) && (
        <form onSubmit={submit} className="goal-add-form">
          <div className="goal-add-row">
            <input className="auth-input" style={{ flex: "2 1 160px" }} placeholder={config.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
            <input className="auth-input" style={{ flex: "1 1 110px" }} type="number" placeholder="Montant" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
          <div className="goal-add-row">
            <input className="auth-input" style={{ flex: "0 1 160px" }} type="date" min={todayISO()} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <span className="card-sub" style={{ display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
              Échéance
              <InfoHint text="Date cible pour atteindre ce montant. Laisse vide si tu n'en as pas. Avec une date, l'app calcule l'épargne mensuelle nécessaire et affiche un compte à rebours." />
            </span>
            <ImagePicker variant="button" value={image} onChange={setImage} alt="Aperçu de l’objectif" />
          </div>
          <textarea className="auth-input" style={{ width: "100%", resize: "vertical" }} placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <button className="checklist-submit" type="submit" style={{ justifySelf: "start" }}>{config.addLabel}</button>
        </form>
      )}
    </div>
  );
}
