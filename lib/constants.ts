// lib/constants.ts — defaults & presets kept in code (not user data).

export const NAV_ITEMS = [
  { section: "dashboard", icon: "🏠", label: "Tableau de bord" },
  { section: "character", icon: "🧍‍♂️", label: "Personnage" },
  { section: "quests", icon: "⚔️", label: "Quêtes spéciales" },
  { section: "routine", icon: "🔁", label: "Routine" },
  { section: "tasks", icon: "⏱️", label: "Tâches du jour" },
  { section: "objectives", icon: "🎯", label: "Objectifs" },
  { section: "projects", icon: "🚀", label: "Projets en cours" },
  { section: "finance", icon: "💰", label: "Budget" },
  { section: "financial-goals", icon: "🎯", label: "Objectifs financiers" },
  { section: "nutrition", icon: "🍽️", label: "Alimentation" },
  { section: "dangers", icon: "🧨", label: "Dangers" },
  { section: "memento", icon: "📝", label: "Memento" },
  { section: "history", icon: "📜", label: "Historique" },
  { section: "training", icon: "🏋️", label: "Entraînement" },
] as const;

export const ACTION_PRESETS: Record<string, { name: string; deltas: Record<string, number> }> = {
  Sport: { name: "Séance de sport", deltas: { force: 4, endurance: 3, energie: -2, discipline: 2 } },
  Lecture: { name: "Lecture 30 minutes", deltas: { culture: 4, mental: 1, discipline: 1 } },
  "Sortie sociale": { name: "Sortie sociale", deltas: { social: 4, humour: 2, energie: -2 } },
  "Mauvaise nuit": { name: "Mauvaise nuit", deltas: { energie: -6, mental: -3, discipline: -1 } },
  "Travail profond": { name: "Travail profond 1h", deltas: { discipline: 3, mental: 2, culture: 1, energie: -1 } },
};
