// lib/constants.ts — defaults & presets kept in code (not user data).

export const NAV_ITEMS = [
  { section: "dashboard", icon: "🏠", label: "Tableau de bord" },
  { section: "recap", icon: "📈", label: "Récap hebdo" },
  { section: "character", icon: "🧍‍♂️", label: "Personnage" },
  { section: "quests", icon: "⚔️", label: "Quêtes spéciales" },
  { section: "routine", icon: "🗓️", label: "Quêtes quotidiennes" },
  { section: "tasks", icon: "⏱️", label: "Tâches" },
  { section: "objectives", icon: "🎯", label: "Objectifs" },
  { section: "projects", icon: "🚀", label: "Projets en cours" },
  { section: "finance", icon: "💰", label: "Budget" },
  { section: "financial-goals", icon: "🎯", label: "Objectifs financiers" },
  { section: "sante", icon: "❤️", label: "Santé" },
  { section: "dangers", icon: "🧨", label: "Dangers" },
  { section: "memento", icon: "📝", label: "Memento" },
  { section: "reflection", icon: "🪞", label: "Réflexion" },
  { section: "history", icon: "📜", label: "Historique" },
  { section: "training", icon: "🏋️", label: "Entraînement" },
  { section: "physique", icon: "📸", label: "Physique" },
] as const;


// ----- Character stat categories ----------------------------------------
// The 3 grouped categories shown on the character page (each = average of its
// sub-stats). 'energie' is handled separately as a standalone gauge.
export const STAT_CATEGORIES = [
  { key: "physique", label: "Physique", icon: "💪" },
  { key: "mental", label: "Mental", icon: "🧠" },
  { key: "personnel", label: "Personnel", icon: "🧍" },
] as const;

export const ENERGY_CATEGORY = { key: "energie", label: "Énergie", icon: "⚡" } as const;

// ----- Level scale -------------------------------------------------------
// XP cost to advance ONE level, by 10-level band (index 0 = levels 1–10,
// index 1 = 11–20, …). Editable — retune the grind here.
export const LEVEL_BAND_COST = [100, 150, 200, 275, 350, 450, 600, 800, 1100, 1500];

// Cumulative XP required to *reach* each level, generated from the bands above.
// Index = level (index 0 unused, L1 = 0). Reaching L100 ≈ 53 750 XP.
export const LEVEL_THRESHOLDS: number[] = (() => {
  const t = [0, 0]; // [0] unused, L1 = 0
  for (let level = 1; level <= 99; level++) {
    const band = Math.min(LEVEL_BAND_COST.length - 1, Math.floor((level - 1) / 10));
    t[level + 1] = (t[level] ?? 0) + (LEVEL_BAND_COST[band] ?? 0);
  }
  return t;
})();

// ----- Level rewards (cosmetics) ----------------------------------------
// A cosmetic unlocks when the user's level >= `level`. Three kinds:
//  - frame  : decorative ring around the avatar (CSS class `frame-<id>`)
//  - badge  : small emblem shown by the avatar
//  - accent : overrides the --accent CSS variable (value = a CSS color)
// PLACEHOLDER catalog — tune levels/values freely.
export type CosmeticType = "frame" | "badge" | "accent";
export interface Cosmetic {
  level: number;
  type: CosmeticType;
  id: string;
  label: string;
  value: string; // accent: CSS color · badge: emoji · frame: unused (styled via CSS)
}

export const LEVEL_REWARDS: Cosmetic[] = [
  // Frames
  { level: 2, type: "frame", id: "bronze", label: "Cadre bronze", value: "" },
  { level: 5, type: "frame", id: "silver", label: "Cadre argent", value: "" },
  { level: 10, type: "frame", id: "gold", label: "Cadre or", value: "" },
  { level: 20, type: "frame", id: "diamond", label: "Cadre diamant", value: "" },
  // Badges
  { level: 3, type: "badge", id: "spark", label: "Étincelle", value: "✨" },
  { level: 7, type: "badge", id: "fire", label: "Flamme", value: "🔥" },
  { level: 15, type: "badge", id: "crown", label: "Couronne", value: "👑" },
  // Accent themes
  { level: 4, type: "accent", id: "emerald", label: "Accent émeraude", value: "#30a46c" },
  { level: 8, type: "accent", id: "violet", label: "Accent violet", value: "#8e4ec6" },
  { level: 12, type: "accent", id: "amber", label: "Accent ambre", value: "#f5a623" },
];

/** The cosmetic catalog entry for an equipped id (or null). */
export function findCosmetic(id: string | null | undefined): Cosmetic | null {
  if (!id) return null;
  return LEVEL_REWARDS.find((c) => c.id === id) ?? null;
}
