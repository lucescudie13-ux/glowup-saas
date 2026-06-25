// lib/utils.ts — shared client/server helpers (ported from the prototype).
import { LEVEL_THRESHOLDS } from "@/lib/constants";

export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

export function percentage(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function money(amount: number): string {
  return `${Number(amount || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} €`;
}

/** Character "score" = average of the stats (0..100). */
export function statsScore(stats: { value: number }[]): number {
  if (!stats.length) return 0;
  return Math.round(stats.reduce((s, x) => s + x.value, 0) / stats.length);
}

/** Average value (0..100) of the stats in a given category. */
export function categoryAverage(stats: { value: number; category?: string }[], category: string): number {
  const inCat = stats.filter((s) => s.category === category);
  return statsScore(inCat);
}

/** Whole-day difference from today to an ISO date (negative = past). */
export function daysUntil(iso: string): number {
  const today = new Date(`${todayISO()}T00:00:00`);
  const target = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// ----- Levels / XP -------------------------------------------------------
// XP accumulates from accomplishments (actions). The level scale is an explicit
// (editable) table of cumulative thresholds in lib/constants `LEVEL_THRESHOLDS`;
// levels beyond the table are extrapolated by a gently rising delta formula.

export const MAX_LEVEL = 100;

/** Fallback per-level delta used beyond the explicit threshold table. */
function deltaFormula(level: number): number {
  return 100 + (Math.max(1, level) - 1) * 20; // L1:100, L2:120, …
}

/** Cumulative XP needed to *reach* `level` (L1 = 0). */
export function xpToReach(level: number): number {
  if (level <= 1) return 0;
  const t = LEVEL_THRESHOLDS[level];
  if (typeof t === "number") return t;
  // Beyond the table: continue from the last explicit entry with the formula.
  let last = LEVEL_THRESHOLDS.length - 1;
  while (last > 1 && typeof LEVEL_THRESHOLDS[last] !== "number") last--;
  let xp = LEVEL_THRESHOLDS[last] ?? 0;
  for (let l = last; l < level; l++) xp += deltaFormula(l);
  return xp;
}

/** XP required to advance FROM `level` to `level + 1`. */
export function xpToAdvance(level: number): number {
  return xpToReach(level + 1) - xpToReach(level);
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
  while (level < MAX_LEVEL && xp >= xpToReach(level + 1)) level++;
  const maxed = level >= MAX_LEVEL;
  const base = xpToReach(level);
  const need = maxed ? 0 : xpToReach(level + 1) - base;
  const into = maxed ? 0 : xp - base;
  const progress = maxed || need <= 0 ? 100 : Math.round((into / need) * 100);
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
