"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { Objective } from "@/types";

interface ReportData {
  month: string;
  review_notes: string;
  next_goals: string;
}

interface HistoryEntry {
  month: string;
  label: string;
  review_notes: string;
  next_goals: string;
}

interface ObjLite {
  id: string;
  name: string;
  progress: number;
}

const COLLAPSE_KEY = "glow.monthlyReport.collapsed";

function ObjectiveList({ items, emptyHref, emptyText }: { items: ObjLite[]; emptyHref: string; emptyText: string }) {
  if (items.length === 0) {
    return (
      <p className="card-sub" style={{ margin: "4px 0 0" }}>
        {emptyText} <Link href={emptyHref} style={{ color: "var(--cyan-soft)" }}>Ajouter →</Link>
      </p>
    );
  }
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
      {items.map((o) => (
        <div className="objective" key={o.id}>
          <div className="objective-head">
            <span className="objective-name">{o.name}</span>
            <span className="objective-percent">{o.progress}%</span>
          </div>
          <div className="objective-progress-line">
            <div className="big-bar"><div className="big-bar-fill" style={{ width: `${o.progress}%` }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MonthlyReport({
  month,
  monthLabel,
  report,
  monthlyObjectives,
  yearlyObjectives,
  history,
  collapsible = true,
}: {
  month: string;
  monthLabel: string;
  report: ReportData | null;
  monthlyObjectives: Objective[];
  yearlyObjectives: Objective[];
  history: HistoryEntry[];
  /** When false, the report is always open (no chevron) — used on its own page. */
  collapsible?: boolean;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(report?.review_notes ?? "");
  const [nextGoals, setNextGoals] = useState(report?.next_goals ?? "");
  const [monthly, setMonthly] = useState<ObjLite[]>(
    monthlyObjectives.map((o) => ({ id: o.id, name: o.name, progress: o.progress })),
  );
  const [newGoal, setNewGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Restore the collapse preference (per device) — only when collapsible.
  useEffect(() => {
    if (collapsible && typeof window !== "undefined" && window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, [collapsible]);
  function toggleCollapse() {
    if (!collapsible) return;
    setCollapsed((c) => {
      const next = !c;
      try { window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }

  const dirty = reviewNotes !== (report?.review_notes ?? "") || nextGoals !== (report?.next_goals ?? "");

  async function saveReport() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.put("/api/monthly-reports", { month, review_notes: reviewNotes, next_goals: nextGoals });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function addAsObjective() {
    const name = newGoal.trim();
    if (!name) return;
    setAdding(true);
    setError(null);
    try {
      const created = await api.post<{ id: string; name: string; progress: number }>("/api/objectives", {
        period: "monthly",
        name,
      });
      setMonthly((prev) => [...prev, { id: created.id, name: created.name, progress: created.progress ?? 0 }]);
      setNewGoal("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l’ajout de l’objectif.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="card monthly-report">
      <div className="card-head" style={collapsible ? { cursor: "pointer" } : undefined} onClick={toggleCollapse}>
        <div>
          <h3 className="card-title">
            {collapsible && (
              <button type="button" className="mr-chevron" aria-label={collapsed ? "Déplier" : "Replier"} aria-expanded={!collapsed}>
                {collapsed ? "▸" : "▾"}
              </button>
            )}{" "}
            📅 Bilan de {monthLabel}
          </h3>
          <p className="card-sub">Fais le point sur le mois écoulé et prépare le suivant.</p>
        </div>
        <Link href="/objectives" className="small-btn" style={{ borderRadius: 12, textDecoration: "none", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
          ✏️ Modifier
        </Link>
      </div>

      {!collapsed && (
        <div className="mr-body">
          {/* This month's targets */}
          <section className="mr-block">
            <div className="mr-block-title">🎯 Cibles du mois</div>
            <ObjectiveList items={monthly} emptyHref="/objectives" emptyText="Aucun objectif du mois défini." />
          </section>

          {/* Self-reflection */}
          <section className="mr-block">
            <div className="mr-block-title">🪞 Ton bilan — objectifs atteints ?</div>
            <textarea
              className="auth-input"
              rows={4}
              placeholder="Qu’as-tu accompli ce mois-ci ? Qu’est-ce qui a marché, ce qui a coincé, ce que tu retiens…"
              value={reviewNotes}
              onChange={(e) => { setReviewNotes(e.target.value); setSaved(false); }}
            />
          </section>

          {/* Next month's goals: free-text plan + quick-add real objective */}
          <section className="mr-block">
            <div className="mr-block-title">🚀 Objectifs du mois prochain</div>
            <textarea
              className="auth-input"
              rows={3}
              placeholder="Ce que tu veux viser le mois prochain (plan libre)…"
              value={nextGoals}
              onChange={(e) => { setNextGoals(e.target.value); setSaved(false); }}
            />
            <div className="mr-quickadd">
              <input
                className="auth-input"
                style={{ flex: "1 1 200px" }}
                placeholder="Transformer une idée en objectif mensuel…"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAsObjective(); } }}
              />
              <button type="button" className="secondary-btn" onClick={addAsObjective} disabled={adding || !newGoal.trim()}>
                {adding ? "Ajout…" : "＋ Créer l’objectif"}
              </button>
            </div>
            <p className="card-sub" style={{ margin: "6px 0 0" }}>
              Un objectif créé ici apparaît dans « Objectifs du mois » et sur la page Objectifs.
            </p>
          </section>

          {/* Save controls */}
          <div className="mr-actions">
            {error && <span className="auth-error" style={{ margin: 0 }}>{error}</span>}
            {saved && !dirty && <span style={{ color: "var(--success)", fontSize: 14 }}>Enregistré ✓</span>}
            <button type="button" className="main-btn" onClick={saveReport} disabled={saving || !dirty} style={{ minWidth: 160 }}>
              {saving ? "Enregistrement…" : "Enregistrer le bilan"}
            </button>
          </div>

          {/* Year reminder */}
          <section className="mr-block mr-year">
            <div className="mr-block-title">🗓️ Rappel — objectifs de l’année</div>
            <ObjectiveList
              items={yearlyObjectives.map((o) => ({ id: o.id, name: o.name, progress: o.progress }))}
              emptyHref="/objectives"
              emptyText="Aucun objectif annuel défini."
            />
          </section>

          {/* Past months */}
          {history.length > 0 && (
            <section className="mr-block">
              <button type="button" className="mr-history-toggle" onClick={() => setShowHistory((s) => !s)}>
                {showHistory ? "▾" : "▸"} Mois précédents ({history.length})
              </button>
              {showHistory && (
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {history.map((h) => (
                    <div key={h.month} className="mr-history-item">
                      <div className="mr-history-month" style={{ textTransform: "capitalize" }}>{h.label}</div>
                      {h.review_notes ? <div className="mr-history-notes"><strong>Bilan :</strong> {h.review_notes}</div> : null}
                      {h.next_goals ? <div className="mr-history-notes"><strong>Objectifs visés :</strong> {h.next_goals}</div> : null}
                      {!h.review_notes && !h.next_goals ? <div className="card-sub">Aucune note.</div> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
