// app/api/export/route.ts
import { ok, requireUser } from "@/server/shared/api";
import { createClient } from "@/lib/supabase/server";

const TABLES = [
  "stats",
  "actions",
  "quests",
  "routines",
  "tasks",
  "objectives",
  "projects",
  "finance_entries",
  "financial_goals",
  "nutrition_goals",
  "foods",
  "workouts",
  "dangers",
  "mementos",
  "sleep_entries",
] as const;

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const supabase = await createClient();
  const out: Record<string, unknown> = { exported_at: new Date().toISOString() };

  // profile (keyed on id)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  out.profile = profile;

  for (const table of TABLES) {
    const ownerCol = table === "nutrition_goals" ? "user_id" : "user_id";
    const { data } = await supabase.from(table).select("*").eq(ownerCol, user.id);
    out[table] = data ?? [];
  }

  return ok(out);
}
