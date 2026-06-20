"use client";

import { levelFromXp } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

/** Compact level + XP widget shown at the top of the sidebar. */
export function SidebarLevel({ profile }: { profile: Profile }) {
  const { level, progress, maxed } = levelFromXp(profile.xp);
  return (
    <div className="side-level">
      <div className="side-level-head">
        <Avatar avatar={profile.avatar} size={34} className="side-level-av" />
        <div className="side-level-id">
          <div className="side-level-name">{profile.display_name}</div>
          <div className="side-level-lvl">⭐ Niveau {level}</div>
        </div>
        <div className="side-level-pct">{maxed ? "MAX" : `${progress}%`}</div>
      </div>
      <div className="big-bar side-level-bar">
        <div className="big-bar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
