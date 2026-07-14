"use client";

import { useState } from "react";

/**
 * Tab switcher for the merged « Récap & bilan » page: weekly recap and monthly
 * bilan under one roof. Both panels are server-rendered and passed in as nodes;
 * this only toggles which one is visible.
 */
export function RecapTabs({
  initial = "hebdo",
  weekly,
  monthly,
}: {
  initial?: "hebdo" | "mensuel";
  weekly: React.ReactNode;
  monthly: React.ReactNode;
}) {
  const [tab, setTab] = useState<"hebdo" | "mensuel">(initial);
  return (
    <>
      <div className="section-tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab${tab === "hebdo" ? " active" : ""}`} onClick={() => setTab("hebdo")}>
          📈 Hebdo
        </button>
        <button type="button" className={`tab${tab === "mensuel" ? " active" : ""}`} onClick={() => setTab("mensuel")}>
          📅 Mensuel
        </button>
      </div>
      {tab === "hebdo" ? weekly : monthly}
    </>
  );
}
