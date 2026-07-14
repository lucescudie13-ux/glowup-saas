// server/settlement/settlement.service.ts
// Daily "settlement": when the user opens the app on a new day, any task that
// was scheduled for the day (scope='today') and left undone gets penalised once
// — it lowers a "Discipline" stat and is logged in history. Idempotent per day
// via profiles.last_settled_day, and per task via tasks.penalized.
import { createClient } from "@/lib/supabase/server";
import { statsService } from "@/server/stats/stats.service";
import { actionsRepository } from "@/server/actions/actions.repository";
import { userRepository } from "@/server/users/user.repository";
import { todayISO, currentPeriodStart, type RoutineFrequency } from "@/lib/utils";
import type { Stat } from "@/types";

const DISCIPLINE_KEY = "discipline";
const PENALTY_PER_TASK = 2;

/** Finds (or creates) the Discipline stat key used for the malus. */
async function ensureDisciplineKey(userId: string): Promise<string> {
  const stats = (await statsService.list(userId)) as Stat[];
  const found = stats.find((s) => s.key === DISCIPLINE_KEY || s.name.toLowerCase() === "discipline");
  if (found) return found.key;
  const created = await statsService.createCustom(userId, { name: "Discipline", value: 50, category: "mental" });
  return created.key;
}

/**
 * Settles all unsettled days up to today. Returns the number of tasks penalised
 * (0 if nothing to do). Never throws to the caller's render path — callers
 * should still guard, but the work itself is defensive.
 */
export async function settleDay(userId: string): Promise<number> {
  const supabase = await createClient();
  const profile = await userRepository.getProfile(userId);
  const today = todayISO();

  if (!profile) return 0;
  if (profile.last_settled_day === today) return 0; // already settled today

  // Tasks scheduled for "today" scope, created before today, still not done and
  // not yet penalised → they were not realised during their day.
  const { data: overdue, error } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("scope", "today")
    .eq("done", false)
    .eq("penalized", false)
    .lt("created_at", `${today}T00:00:00`);

  if (error) {
    // Don't block the app on a settlement failure; just skip this run.
    return 0;
  }

  const ids = (overdue ?? []).map((t) => t.id);
  const n = ids.length;

  if (n > 0) {
    const key = await ensureDisciplineKey(userId);
    const deltas = { [key]: -PENALTY_PER_TASK * n };
    await statsService.applyDeltas(userId, deltas);
    await actionsRepository.create(userId, {
      name: `Malus : ${n} tâche(s) non faite(s)`,
      deltas,
    });
    // Mark them so they're never penalised twice (they stay in the list).
    await supabase.from("tasks").update({ penalized: true }).in("id", ids).eq("user_id", userId);
  }

  await supabase.from("profiles").update({ last_settled_day: today }).eq("id", userId);
  return n;
}

/**
 * Resets recurring quests (routines) at the start of each new period: any quest
 * marked done but last completed in a *previous* day/week/month is un-checked so
 * it's due again this period. `completed_at` is kept as the last-completion
 * record (used to flag it red when a period ended without it). Idempotent — only
 * touches stale rows. Never throws to the render path.
 */
export async function resetRecurringRoutines(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: routines, error } = await supabase
    .from("routines")
    .select("id, frequency, completed_at")
    .eq("user_id", userId)
    .eq("done", true);
  if (error || !routines?.length) return 0;

  const now = new Date();
  const stale = routines.filter((r) => {
    const freq = ((r.frequency ?? "daily") as RoutineFrequency);
    const start = currentPeriodStart(now, freq).getTime();
    return !r.completed_at || new Date(r.completed_at).getTime() < start;
  });
  if (!stale.length) return 0;

  await supabase
    .from("routines")
    .update({ done: false })
    .in("id", stale.map((r) => r.id))
    .eq("user_id", userId);
  return stale.length;
}
