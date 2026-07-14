"use client";

import { useState } from "react";

/**
 * Tab switcher for the merged « Objectifs & projets » page. Both panels are
 * server-rendered and passed in as nodes; this only toggles which is visible.
 */
export function ObjectivesTabs({
  initial = "objectifs",
  objectives,
  projects,
}: {
  initial?: "objectifs" | "projets";
  objectives: React.ReactNode;
  projects: React.ReactNode;
}) {
  const [tab, setTab] = useState<"objectifs" | "projets">(initial);
  return (
    <>
      <div className="section-tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab${tab === "objectifs" ? " active" : ""}`} onClick={() => setTab("objectifs")}>
          🎯 Objectifs
        </button>
        <button type="button" className={`tab${tab === "projets" ? " active" : ""}`} onClick={() => setTab("projets")}>
          🚀 Projets
        </button>
      </div>
      {tab === "objectifs" ? objectives : projects}
    </>
  );
}
