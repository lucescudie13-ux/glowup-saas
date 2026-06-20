import { levelFromXp, MAX_LEVEL } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

/**
 * Clean character "fiche": avatar, name, level and a thin XP bar.
 * Shown on the character page (the chrome-level widget lives in the sidebar).
 */
export function LevelHero({ profile, score }: { profile: Profile; score?: number }) {
  const { level, progress, totalXp, maxed } = levelFromXp(profile.xp);

  return (
    <div className="card level-hero">
      <div className="level-hero-top">
        <Avatar avatar={profile.avatar} size={64} className="level-hero-avatar" />
        <div className="level-hero-id">
          <div className="level-hero-name">{profile.display_name ?? "Mon perso"}</div>
          <div className="level-hero-meta">
            <span className="level-badge">⭐ Niveau {level}{maxed ? " · MAX" : ` / ${MAX_LEVEL}`}</span>
            {typeof score === "number" && <span className="level-score">Score {score}/100</span>}
          </div>
        </div>
        <div className="level-hero-xp-num">{totalXp}<span> XP</span></div>
      </div>

      <div className="level-xp-bar" title={`${progress}% vers le niveau ${level + 1}`}>
        <div className="level-xp-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="level-xp-caption">
        {maxed ? "Niveau maximum atteint 🏆" : `${progress}% vers le niveau ${level + 1}`}
      </div>
    </div>
  );
}
