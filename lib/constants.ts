// lib/constants.ts — defaults & presets kept in code (not user data).

export const NAV_ITEMS = [
  { section: "dashboard", icon: "🏠", label: "Tableau de bord" },
  { section: "recap", icon: "📈", label: "Récap hebdo" },
  { section: "character", icon: "🧍‍♂️", label: "Personnage" },
  { section: "quests", icon: "⚔️", label: "Quêtes spéciales" },
  { section: "routine", icon: "🔁", label: "Routine" },
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

// Example accomplishments. XP earned = sum of an action's positive deltas, so
// each preset doubles as a sample of "how to level up". Tweak freely.
export const ACTION_PRESETS: Record<string, { name: string; deltas: Record<string, number> }> = {
  Sport: { name: "Séance de sport", deltas: { force: 4, endurance: 3, energie: -2, discipline: 2 } },
  Lecture: { name: "Lecture 30 minutes", deltas: { culture: 4, mental: 1, discipline: 1 } },
  Méditation: { name: "Méditation 10 min", deltas: { mental: 3, discipline: 2, energie: 1 } },
  Apprentissage: { name: "Cours / formation 1h", deltas: { culture: 5, discipline: 2, mental: 1 } },
  "Sortie sociale": { name: "Sortie sociale", deltas: { social: 4, humour: 2, energie: -2 } },
  "Travail profond": { name: "Travail profond 1h", deltas: { discipline: 3, mental: 2, culture: 1, energie: -1 } },
  "Grosse victoire": { name: "Grosse victoire", deltas: { mental: 4, discipline: 3, social: 2, humour: 1 } },
  "Mauvaise nuit": { name: "Mauvaise nuit", deltas: { energie: -6, mental: -3, discipline: -1 } },
};
