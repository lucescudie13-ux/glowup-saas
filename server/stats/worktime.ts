// server/stats/worktime.ts
// Cumulative "work time" = minutes from completed tasks (dated by completed_at)
// + workout durations (run seconds→min, boxing minutes, strength estimated as
// sets × ~3 min). Used by the character KPIs and the weekly recap.
import { todayISO, addDaysISO } from "@/lib/utils";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type WorkTime = { today: number; week: number; total: number };

/** Estimated minutes for a single workout from its type-specific `data`. */
export function workoutMinutes(type: string, data: unknown): number {
  const d = (data ?? {}) as Record<string, unknown>;
  if (type === "run") return Math.round(Number(d.seconds ?? 0) / 60);
  if (type === "boxing") return Math.round(Number(d.minutes ?? 0));
  if (type === "strength") return Math.round(Number(d.sets ?? 0) * 3); // estimate
  return 0;
}

export async function workTime(
  supabase: SupabaseClient<Database>,
  uid: string
): Promise<WorkTime> {
  const today = todayISO();
  const weekStart = addDaysISO(today, -6); // last 7 days incl. today

  const [tasksRes, workoutsRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("minutes, completed_at")
      .eq("user_id", uid)
      .eq("done", true)
      .not("completed_at", "is", null),
    supabase.from("workouts").select("type, data, workout_date").eq("user_id", uid),
  ]);

  const acc: WorkTime = { today: 0, week: 0, total: 0 };

  for (const t of tasksRes.data ?? []) {
    const day = (t.completed_at ?? "").slice(0, 10);
    const min = Number(t.minutes ?? 0);
    if (!day || min <= 0) continue;
    acc.total += min;
    if (day >= weekStart) acc.week += min;
    if (day === today) acc.today += min;
  }

  for (const w of workoutsRes.data ?? []) {
    const day = (w.workout_date ?? "").slice(0, 10);
    const min = workoutMinutes(w.type, w.data);
    if (min <= 0) continue;
    acc.total += min;
    if (day >= weekStart) acc.week += min;
    if (day === today) acc.today += min;
  }

  return acc;
}

/** "4 h 05" / "45 min" — compact French duration from minutes. */
export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h} h ${String(rem).padStart(2, "0")}` : `${h} h`;
}
