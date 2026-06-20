// server/shared/import.service.ts
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

function relaxed(client: SupabaseClient<Database>): SupabaseClient {
  return client as unknown as SupabaseClient;
}

/**
 * Column allowlist per table. Only these fields are ever written, so an
 * import file can never inject arbitrary columns. `id`, `user_id`, `created_at`
 * and `updated_at` are intentionally excluded — ids are regenerated and
 * ownership is re-stamped server-side.
 */
const APPEND_TABLES: Record<string, string[]> = {
  actions: ["name", "deltas", "action_date"],
  quests: ["name", "category", "done"],
  routines: ["name", "minutes", "category", "done"],
  tasks: ["name", "minutes", "category", "done"],
  objectives: ["period", "name", "actions", "progress", "details"],
  projects: ["name", "progress"],
  finance_entries: ["type", "name", "amount", "category", "entry_date"],
  financial_goals: ["name", "target", "saved"],
  foods: ["name", "meal", "calories", "protein", "carbs", "fat", "food_date"],
  workouts: ["type", "workout_date", "data"],
  dangers: ["name", "category", "impact"],
  mementos: ["name", "done"],
  sleep_entries: ["sleep_date", "hours", "kind", "note"],
};

const PROFILE_FIELDS = [
  "display_name",
  "avatar",
  "pref_notif",
  "pref_daily",
  "streak_count",
  "streak_last_active_day",
  "xp",
  "routine_streak_count",
  "routine_streak_last_day",
  "routine_deadline",
];
const NUTRITION_FIELDS = ["calories", "protein", "carbs", "fat"];
const STAT_FIELDS = ["key", "name", "value", "is_custom"];

function pick(row: unknown, fields: string[]): Record<string, unknown> | null {
  if (typeof row !== "object" || row === null) return null;
  const src = row as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) if (src[f] !== undefined) out[f] = src[f];
  return out;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export type ImportSummary = Record<string, number>;

/**
 * Non-destructive restore: appends list rows (fresh ids), upserts the
 * singletons (profile, nutrition goals) and the stats (by key, to respect the
 * unique(user_id, key) constraint). Returns a per-table count of rows written.
 */
export async function importUserData(
  userId: string,
  payload: Record<string, unknown>
): Promise<ImportSummary> {
  const db = relaxed(await createClient());
  const summary: ImportSummary = {};

  // profile (update only — the row already exists for an authenticated user)
  const profile = pick(payload.profile, PROFILE_FIELDS);
  if (profile && Object.keys(profile).length > 0) {
    const { error } = await db.from("profiles").update(profile).eq("id", userId);
    if (error) throw error;
    summary.profiles = 1;
  }

  // nutrition_goals (singleton upsert)
  const goals = pick(payload.nutrition_goals, NUTRITION_FIELDS);
  if (goals && Object.keys(goals).length > 0) {
    const { error } = await db
      .from("nutrition_goals")
      .upsert({ user_id: userId, ...goals }, { onConflict: "user_id" });
    if (error) throw error;
    summary.nutrition_goals = 1;
  }

  // stats (upsert by unique (user_id, key))
  const statRows = asArray(payload.stats)
    .map((r) => pick(r, STAT_FIELDS))
    .filter((r): r is Record<string, unknown> => !!r && typeof r.key === "string")
    .map((r) => ({ ...r, user_id: userId }));
  if (statRows.length > 0) {
    const { error } = await db.from("stats").upsert(statRows, { onConflict: "user_id,key" });
    if (error) throw error;
    summary.stats = statRows.length;
  }

  // append tables (insert fresh rows)
  for (const [table, fields] of Object.entries(APPEND_TABLES)) {
    const rows = asArray(payload[table])
      .map((r) => pick(r, fields))
      .filter((r): r is Record<string, unknown> => !!r && Object.keys(r).length > 0)
      .map((r) => ({ ...r, user_id: userId }));
    if (rows.length === 0) continue;
    const { error } = await db.from(table).insert(rows);
    if (error) throw error;
    summary[table] = rows.length;
  }

  return summary;
}
