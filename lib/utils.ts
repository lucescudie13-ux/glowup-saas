// lib/utils.ts — shared client/server helpers (ported from the prototype).

export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export function percentage(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function money(amount: number): string {
  return `${Number(amount || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
}

/** Character "score" = average of the 8 stats (0..100). */
export function statsScore(stats: { value: number }[]): number {
  if (!stats.length) return 0;
  return Math.round(stats.reduce((s, x) => s + x.value, 0) / stats.length);
}

// ----- Levels / XP -------------------------------------------------------
// XP accumulates from accomplishments (actions). Each level costs a bit more
// than the previous; filling a level's bar to 100% advances to the next.

export const MAX_LEVEL = 100;

/** XP required to advance FROM `level` to `level + 1`. Gently rising curve. */
export function xpToAdvance(level: number): number {
  return 100 + (Math.max(1, level) - 1) * 20; // L1:100, L2:120, … L99:2060
}

/** XP earned by an action = sum of its positive deltas (the progression part). */
export function actionXp(deltas: Record<string, number>): number {
  return Object.values(deltas).reduce((s, v) => s + Math.max(0, Math.round(v)), 0);
}

/**
 * Derive level + bar progress from total accumulated XP.
 * Caps at MAX_LEVEL (bar shows full once maxed out).
 */
export function levelFromXp(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp || 0));
  let level = 1;
  let remaining = xp;
  while (level < MAX_LEVEL && remaining >= xpToAdvance(level)) {
    remaining -= xpToAdvance(level);
    level++;
  }
  const maxed = level >= MAX_LEVEL;
  const need = maxed ? 0 : xpToAdvance(level);
  const into = maxed ? 0 : remaining;
  const progress = maxed ? 100 : Math.round((into / need) * 100);
  return { level, xpIntoLevel: into, xpForNext: need, progress, totalXp: xp, maxed };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Shift an ISO date (YYYY-MM-DD) by a number of days. */
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Short human label for an ISO date, e.g. "lun. 9 juin". */
export function formatDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatRelative(ts: string | number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "à l’instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
