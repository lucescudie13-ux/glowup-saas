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

/** Character level + score from the 8 stats (avg/10, min 1). */
export function characterLevel(stats: { value: number }[]) {
  if (!stats.length) return { avg: 0, level: 1, levelProgress: 0 };
  const avg = Math.round(stats.reduce((s, x) => s + x.value, 0) / stats.length);
  const level = Math.max(1, Math.floor(avg / 10));
  const levelProgress = (avg % 10) * 10;
  return { avg, level, levelProgress };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
