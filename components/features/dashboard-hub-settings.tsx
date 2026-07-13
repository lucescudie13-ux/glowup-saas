"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { HUB_SECTIONS } from "@/lib/constants";

/**
 * Lets the user pick which « Journal de quêtes » points appear on the
 * dashboard. Each toggle patches the profile (dashboard_hub_sections), which
 * the server-rendered dashboard reads to decide what to show.
 */
export function DashboardHubSettings({ initial }: { initial: string[] }) {
  const router = useRouter();
  const [visible, setVisible] = useState<string[]>(initial);

  async function toggle(key: string) {
    const snapshot = visible;
    const next = visible.includes(key) ? visible.filter((k) => k !== key) : [...visible, key];
    setVisible(next); // optimistic
    try {
      await api.patch("/api/user", { dashboard_hub_sections: next });
      router.refresh();
    } catch {
      setVisible(snapshot);
    }
  }

  return (
    <div className="card hub-settings">
      <div className="card-head">
        <div>
          <h3 className="card-title">🗂️ Affichage sur le tableau de bord</h3>
          <p className="card-sub">Choisis les points de ce journal à afficher sur ton tableau de bord.</p>
        </div>
      </div>
      <div className="hub-toggle-grid">
        {HUB_SECTIONS.map((s) => {
          const on = visible.includes(s.key);
          return (
            <button
              key={s.key}
              type="button"
              className={`hub-toggle${on ? " on" : ""}`}
              onClick={() => toggle(s.key)}
              aria-pressed={on}
            >
              <span className="hub-toggle-icon">{s.icon}</span>
              <span className="hub-toggle-label">{s.label}</span>
              <span className="hub-toggle-state">{on ? "✓ Affiché" : "Masqué"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
