import { levelFromXp, MAX_LEVEL } from "@/lib/utils";
import { findCosmetic } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

/**
 * Clean character "fiche": avatar, name, level and a thin XP bar.
 * Shown on the character page (the chrome-level widget lives in the sidebar).
 */
interface CategoryGauge {
  label: string;
  value: number;
  color: string;
}

export function LevelHero({
  profile,
  score,
  categories,
}: {
  profile: Profile;
  score?: number;
  categories?: CategoryGauge[];
}) {
  const { level, progress, totalXp, maxed } = levelFromXp(profile.xp);
  const frame = findCosmetic(profile.equipped_frame);
  const badge = findCosmetic(profile.equipped_badge);

  return (
    <div className="card level-hero">
      <div className="level-hero-top">
        <span className={`cosmetic-frame${frame ? ` frame-${frame.id}` : ""}`} style={{ position: "relative", display: "inline-flex", borderRadius: "50%" }}>
          <Avatar avatar={profile.avatar} size={64} className="level-hero-avatar" />
          {badge && <span className="cosmetic-badge" title={badge.label}>{badge.value}</span>}
        </span>
        <div className="level-hero-id">
          <div className="level-hero-name" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {profile.display_name ?? "Mon perso"}
            <span className="level-badge">⭐ Niv. {level}{maxed ? " · MAX" : ` / ${MAX_LEVEL}`}</span>
          </div>
          <div className="level-hero-meta">
            {typeof score === "number" && <span className="level-score">Score {score}/100</span>}
          </div>
        </div>
        <div className="level-hero-xp-num">{totalXp}<span> XP</span></div>
      </div>

      {categories && categories.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, margin: "4px 0 14px" }}>
          {categories.map((c) => (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: "var(--muted)" }}>{c.label}</span>
                <span style={{ color: c.color, fontWeight: 700 }}>{c.value}</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(0, Math.min(100, c.value))}%`, height: "100%", background: c.color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="level-xp-bar" title={`${progress}% vers le niveau ${level + 1}`}>
        <div className="level-xp-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="level-xp-caption">
        {maxed ? "Niveau maximum atteint 🏆" : `${progress}% vers le niveau ${level + 1}`}
      </div>
    </div>
  );
}
