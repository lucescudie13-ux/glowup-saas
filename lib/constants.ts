// lib/constants.ts — defaults & presets kept in code (not user data).

export const NAV_ITEMS = [
  { section: "dashboard", icon: "🏠", label: "Tableau de bord" },
  { section: "recap", icon: "📈", label: "Récap hebdo" },
  { section: "bilan", icon: "📅", label: "Bilan mensuel" },
  { section: "character", icon: "🧍‍♂️", label: "Personnage" },
  { section: "journal", icon: "🗺️", label: "Journal de quêtes" },
  { section: "objectives", icon: "🎯", label: "Objectifs" },
  { section: "projects", icon: "🚀", label: "Projets en cours" },
  { section: "finance", icon: "💰", label: "Finances" },
  { section: "sante", icon: "❤️", label: "Santé" },
  { section: "dangers", icon: "🧨", label: "Dangers" },
  { section: "memento", icon: "📝", label: "Memento" },
  { section: "reflection", icon: "🪞", label: "Réflexion" },
  { section: "history", icon: "📜", label: "Historique" },
  { section: "training", icon: "🏋️", label: "Entraînement" },
  { section: "physique", icon: "📸", label: "Physique" },
] as const;


// ----- « Journal de quêtes » — les 6 sous-points regroupés ---------------
// Tâches (du jour / autres), quêtes récurrentes (quotidiennes / hebdo /
// mensuelles) et quêtes spéciales, réunies dans une seule page. Chaque point
// peut être affiché ou masqué sur le tableau de bord (profiles.dashboard_hub_sections).
export type HubResource = "tasks" | "routines" | "quests";

export interface HubSection {
  key: string;
  label: string;
  icon: string;
  resource: HubResource;
  /** For tasks: which scope this point covers. */
  scope?: "today" | "other";
  /** For routines: which frequency this point covers. */
  frequency?: "daily" | "weekly" | "monthly";
}

export const HUB_SECTIONS: HubSection[] = [
  { key: "tasks-today", label: "Tâches du jour", icon: "⏱️", resource: "tasks", scope: "today" },
  { key: "routine-daily", label: "Quêtes quotidiennes", icon: "🗓️", resource: "routines", frequency: "daily" },
  { key: "tasks-other", label: "Autres tâches", icon: "📋", resource: "tasks", scope: "other" },
  { key: "routine-weekly", label: "Quêtes hebdomadaires", icon: "📅", resource: "routines", frequency: "weekly" },
  { key: "routine-monthly", label: "Quêtes mensuelles", icon: "🌙", resource: "routines", frequency: "monthly" },
  { key: "quests-special", label: "Quêtes spéciales", icon: "⚔️", resource: "quests" },
];

/** All hub-section keys, in canonical order — the default (everything shown). */
export const HUB_SECTION_KEYS = HUB_SECTIONS.map((s) => s.key);


// ----- Character stat categories ----------------------------------------
// The 3 grouped categories shown on the character page (each = average of its
// sub-stats). 'energie' is handled separately as a standalone gauge.
export const STAT_CATEGORIES = [
  { key: "physique", label: "Physique", icon: "💪" },
  { key: "mental", label: "Mental", icon: "🧠" },
  { key: "personnel", label: "Personnel", icon: "🧍" },
  { key: "social", label: "Social", icon: "🤝" },
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
