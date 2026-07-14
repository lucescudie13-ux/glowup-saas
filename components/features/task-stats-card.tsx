"use client";

import { useState } from "react";
import { formatDayLabel } from "@/lib/utils";

interface StatItem {
  id: string;
  name: string;
  /** "tâche" or "quête" — shown as a small tag since the two are merged. */
  kind?: "tâche" | "quête";
  completed_at?: string | null;
  created_at?: string;
  deadline?: string | null;
  category?: string;
}

/** Counts of items in each period (done = by completion date, to-do = by creation date). */
export interface TaskCounts {
  week: number;
  month: number;
  year: number;
  total: number;
}

/** One clickable stat tile: its total, its period recap and the list behind it. */
export interface StatGroup {
  key: string;
  label: string;
  tone: "done" | "todo";
  /** How to format each row's date: completion date, or deadline/creation date. */
  dateKind: "done" | "todo";
  counts: TaskCounts;
  items: StatItem[];
}

/**
 * Task & quest statistics. Two tiles — everything you've done vs everything
 * still to do (tasks and quests combined). The "à faire" tile is red to make
 * unfinished work obvious. Clicking a tile expands a recap (this week / month /
 * year / total) plus the list, where each row is tagged « tâche » or « quête ».
 * Counts come from the server; only DATE parts are formatted here so hydration
 * stays safe.
 */
export function TaskStatsCard({ groups }: { groups: StatGroup[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const toggle = (key: string) => setOpenKey((cur) => (cur === key ? null : key));

  const open = groups.find((g) => g.key === openKey) ?? null;
  const list = open
    ? [...open.items].sort((a, b) =>
        open.dateKind === "done"
          ? (b.completed_at ?? "").localeCompare(a.completed_at ?? "") // most recent first
          : (a.deadline ?? a.created_at ?? "").localeCompare(b.deadline ?? b.created_at ?? ""), // soonest first
      )
    : [];

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3 className="card-title">📊 Statistiques des tâches</h3>
          <p className="card-sub">Tâches et quêtes réunies. Clique une tuile pour le détail par période.</p>
        </div>
      </div>

      <div className="task-stat-tiles">
        {groups.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`task-stat-tile is-${g.tone}${openKey === g.key ? " active" : ""}`}
            onClick={() => toggle(g.key)}
            aria-expanded={openKey === g.key}
          >
            <span className="task-stat-value">{g.counts.total}</span>
            <span className="task-stat-label">{g.label}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className={`task-stat-detail is-${open.tone}`}>
          <div className="task-recap">
            <div className="task-recap-item"><span className="task-recap-value">{open.counts.week}</span><span className="task-recap-label">Cette semaine</span></div>
            <div className="task-recap-item"><span className="task-recap-value">{open.counts.month}</span><span className="task-recap-label">Ce mois-ci</span></div>
            <div className="task-recap-item"><span className="task-recap-value">{open.counts.year}</span><span className="task-recap-label">Cette année</span></div>
            <div className="task-recap-item"><span className="task-recap-value">{open.counts.total}</span><span className="task-recap-label">Total</span></div>
          </div>

          <ul className="task-stat-list">
            {list.length === 0 ? (
              <li className="task-stat-empty">
                {open.tone === "done" ? "Rien de fait ici pour l’instant." : "Rien à faire ici — tout est bouclé ! 🎉"}
              </li>
            ) : (
              list.map((t) => (
                <li className="task-stat-row" key={t.id}>
                  <span className="task-stat-name">{t.name}</span>
                  {t.kind ? <span className={`item-kind is-${t.kind === "quête" ? "quest" : "task"}`}>{t.kind}</span> : null}
                  {t.category ? <span className="cat-tag">{t.category}</span> : null}
                  <span className="task-stat-date">
                    {open.dateKind === "done"
                      ? t.completed_at
                        ? `✅ fait le ${formatDayLabel(t.completed_at.slice(0, 10))}`
                        : "✅ fait"
                      : t.deadline
                        ? `🗓️ échéance ${formatDayLabel(t.deadline.slice(0, 10))}`
                        : t.created_at
                          ? `créée le ${formatDayLabel(t.created_at.slice(0, 10))}`
                          : "à faire"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
