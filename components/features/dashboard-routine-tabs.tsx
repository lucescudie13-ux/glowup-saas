"use client";

import { useState } from "react";
import { DashboardCheckList } from "@/components/features/dashboard-check-list";
import type { Routine } from "@/types";

/** Dashboard card body: switch between weekly and monthly quests. */
export function DashboardRoutineTabs({ weekly, monthly }: { weekly: Routine[]; monthly: Routine[] }) {
  const [tab, setTab] = useState<"weekly" | "monthly">(weekly.length || !monthly.length ? "weekly" : "monthly");
  const items = tab === "weekly" ? weekly : monthly;

  return (
    <div>
      <div className="section-tabs" style={{ marginBottom: 10 }}>
        <button type="button" className={`tab${tab === "weekly" ? " active" : ""}`} onClick={() => setTab("weekly")}>
          📅 Hebdo ({weekly.length})
        </button>
        <button type="button" className={`tab${tab === "monthly" ? " active" : ""}`} onClick={() => setTab("monthly")}>
          🌙 Mensuel ({monthly.length})
        </button>
      </div>
      {items.length ? (
        <DashboardCheckList resource="routines" items={items} />
      ) : (
        <p className="card-sub">Aucune quête {tab === "weekly" ? "hebdomadaire" : "mensuelle"}.</p>
      )}
    </div>
  );
}
