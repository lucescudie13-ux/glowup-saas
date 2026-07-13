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

/**
 * Energy for *today*: starts high in the morning and drains through the day
 * (unlike the fixed stats). Full at 06:00, nearly empty at 23:00; overnight it
 * counts as rested. Purely time-based — a living gauge, not a stored stat.
 */
export function dayEnergyPercent(now: Date = new Date()): number {
  const h = now.getHours() + now.getMinutes() / 60;
  const START = 6;
  const END = 23;
  if (h < START) return 100; // overnight / early morning: rested
  if (h >= END) return 8; // late night: drained
  const pct = 100 * (1 - (h - START) / (END - START));
  return Math.round(Math.max(8, Math.min(100, pct)));
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

/** Whole months remaining until an ISO date (end of that day), at least 1. */
export function monthsUntil(iso: string): number {
  const target = new Date(`${iso.slice(0, 10)}T23:59:59`).getTime();
  const days = (target - Date.now()) / 86_400_000;
  return Math.max(1, Math.ceil(days / 30.44));
}

/**
 * How much to set aside each month to cover `remaining` by `deadline`.
 * Returns 0 when there's no deadline or nothing left to save.
 */
export function monthlySavingNeeded(remaining: number, deadline: string | null | undefined): number {
  if (!deadline || remaining <= 0) return 0;
  return Math.ceil(remaining / monthsUntil(deadline));
}

/** Human label for a 'YYYY-MM' month key, e.g. "juin 2026". */
export function monthLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

/** The 'YYYY-MM' key of the month before the given 'YYYY-MM' (pure arithmetic, no TZ). */
export function prevMonthKey(monthKey: string): string {
  const parts = monthKey.split("-");
  let y = Number(parts[0]);
  let m = Number(parts[1]) - 1;
  if (m < 1) { m = 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
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

// =====================================================================
// Échéances / retard (« overdue ») — calculé en heure LOCALE de l'utilisateur
// pour que « avant minuit » corresponde à son minuit. Utilisé côté client.
// =====================================================================
export type RoutineFrequency = "daily" | "weekly" | "monthly";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/** Start of the ISO week (Monday 00:00) containing d. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const mondayOffset = (s.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0 …
  s.setDate(s.getDate() - mondayOffset);
  return s;
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Start of the period *before* the one containing `now`, for a frequency. */
export function previousPeriodStart(now: Date, freq: RoutineFrequency): Date {
  if (freq === "weekly") {
    const s = startOfWeek(now);
    s.setDate(s.getDate() - 7);
    return s;
  }
  if (freq === "monthly") {
    const s = startOfMonth(now);
    s.setMonth(s.getMonth() - 1);
    return s;
  }
  const s = startOfDay(now);
  s.setDate(s.getDate() - 1);
  return s;
}

/** Start of the current period containing `now`, for a frequency. */
export function currentPeriodStart(now: Date, freq: RoutineFrequency): Date {
  return freq === "weekly" ? startOfWeek(now) : freq === "monthly" ? startOfMonth(now) : startOfDay(now);
}

/**
 * Whether an item is overdue (should show red) at `now`.
 *  - tasks (scope "today"): overdue once the day it was created has fully passed.
 *  - tasks (scope "other"): overdue once its custom `deadline` has passed.
 *  - routines: overdue when not done and the PREVIOUS period ended without a
 *    completion (uses completed_at, falling back to created_at).
 * Done items are never overdue.
 */
export function isItemOverdue(
  resource: string,
  item: {
    done?: boolean | null;
    created_at?: string | null;
    completed_at?: string | null;
    deadline?: string | null;
    scope?: string | null;
    frequency?: string | null;
  },
  now: Date = new Date(),
): boolean {
  if (item.done) return false;

  if (resource === "tasks") {
    if (item.scope === "other") {
      return !!item.deadline && now.getTime() > new Date(item.deadline).getTime();
    }
    // "today" scope: due by the end of the day it was created for.
    if (!item.created_at) return false;
    return startOfDay(now).getTime() > startOfDay(new Date(item.created_at)).getTime();
  }

  if (resource === "routines") {
    const freq = (item.frequency as RoutineFrequency) ?? "daily";
    const refStr = item.completed_at ?? item.created_at;
    if (!refStr) return false;
    return new Date(refStr).getTime() < previousPeriodStart(now, freq).getTime();
  }

  return false; // quests & others: no deadline rule
}

/**
 * A completed task moves to the "Done" category only the day *after* it was
 * ticked — so it stays visible (checked) in its own category for the rest of
 * that day. True once `completedAt` is on a strictly earlier day than `now`.
 */
export function isCompletedBeforeToday(completedAt: string | null | undefined, now: Date = new Date()): boolean {
  if (!completedAt) return false;
  return new Date(completedAt).getTime() < startOfDay(now).getTime();
}
