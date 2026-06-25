"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Avatar } from "@/components/ui/avatar";
import { LEVEL_REWARDS, type CosmeticType } from "@/lib/constants";
import type { Profile } from "@/types";

const GROUPS: { type: CosmeticType; title: string; field: keyof Profile }[] = [
  { type: "frame", title: "Cadres d’avatar", field: "equipped_frame" },
  { type: "badge", title: "Badges", field: "equipped_badge" },
  { type: "accent", title: "Couleurs d’accent", field: "equipped_accent" },
];

export function CosmeticsManager({ profile, level }: { profile: Profile; level: number }) {
  const router = useRouter();
  const [equipped, setEquipped] = useState<Record<CosmeticType, string | null>>({
    frame: profile.equipped_frame,
    badge: profile.equipped_badge,
    accent: profile.equipped_accent,
  });

  async function toggle(type: CosmeticType, field: keyof Profile, id: string) {
    const next = equipped[type] === id ? null : id;
    setEquipped((prev) => ({ ...prev, [type]: next })); // optimistic
    try {
      await api.patch("/api/user", { [field]: next });
      router.refresh();
    } catch {
      setEquipped((prev) => ({ ...prev, [type]: profile[field] as string | null }));
    }
  }

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <div>
          <h2 className="card-title">🎁 Récompenses</h2>
          <p className="card-sub">Cosmétiques débloqués en montant de niveau. Équipe ceux que tu as gagnés.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        {GROUPS.map((group) => {
          const items = LEVEL_REWARDS.filter((c) => c.type === group.type);
          if (items.length === 0) return null;
          return (
            <div key={group.type}>
              <div className="card-sub" style={{ marginBottom: 8 }}>{group.title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {items.map((c) => {
                  const unlocked = level >= c.level;
                  const isEquipped = equipped[group.type] === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => toggle(c.type, group.field, c.id)}
                      title={unlocked ? (isEquipped ? "Équipé — clique pour retirer" : "Équiper") : `Débloqué au niveau ${c.level}`}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                        padding: 10, borderRadius: 10, cursor: unlocked ? "pointer" : "not-allowed",
                        border: `2px solid ${isEquipped ? "var(--cyan)" : "var(--line)"}`,
                        background: "transparent", opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      {/* Preview */}
                      {c.type === "frame" && (
                        <span className={`cosmetic-frame frame-${c.id}`} style={{ display: "inline-flex", borderRadius: "50%" }}>
                          <Avatar avatar={profile.avatar} size={40} />
                        </span>
                      )}
                      {c.type === "badge" && <span style={{ fontSize: 30, lineHeight: 1 }}>{c.value}</span>}
                      {c.type === "accent" && <span style={{ width: 34, height: 34, borderRadius: "50%", background: c.value, display: "inline-block" }} />}

                      <span style={{ fontSize: 12, textAlign: "center" }}>{c.label}</span>
                      <span className="card-sub" style={{ fontSize: 11 }}>
                        {unlocked ? (isEquipped ? "✓ Équipé" : "Disponible") : `🔒 Niv. ${c.level}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
