"use client";

import { levelFromXp } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { CategoryGauge } from "@/components/layout/app-shell";
import type { Profile } from "@/types";

/** Compact profile widget at the top of the sidebar: avatar + name + level + category gauges. */
export function SidebarLevel({ profile, categories }: { profile: Profile; categories?: CategoryGauge[] }) {
  const { level, progress, maxed } = levelFromXp(profile.xp);
  return (
    <div className="side-level">
      <div className="side-level-head">
        <div style={{ position: "relative", display: "inline-flex" }}>
          <Avatar avatar={profile.avatar} size={40} className="side-level-av" />
          <span
            title={`Niveau ${level}`}
            style={{
              position: "absolute", right: -6, bottom: -6,
              background: "var(--cyan)", color: "#04121a",
              fontWeight: 800, fontSize: 10, lineHeight: 1,
              padding: "3px 5px", borderRadius: 8, border: "2px solid var(--bg-2, #0c1420)",
            }}
          >
            {maxed ? "MAX" : level}
          </span>
        </div>
        <div className="side-level-id" style={{ flex: 1, minWidth: 0 }}>
          <div className="side-level-name">{profile.display_name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <div className="big-bar" style={{ flex: 1 }}>
              <div className="big-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="side-level-pct" style={{ fontSize: 11 }}>{maxed ? "MAX" : `${progress}%`}</span>
          </div>
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          {categories.map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", width: 62, flexShrink: 0 }}>{c.label}</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(0, Math.min(100, c.value))}%`, height: "100%", background: c.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: c.color, width: 22, textAlign: "right" }}>{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
