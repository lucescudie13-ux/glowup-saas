import type { NextRequest } from "next/server";
import { ok, fail } from "@/server/shared/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPush, type PushPayload } from "@/lib/push";
import type { PushSubscription } from "web-push";

/**
 * Scheduled push sender (Vercel Cron). Authorised by the CRON_SECRET bearer
 * token Vercel injects. ?type=daily | weekly.
 *  - daily  → opted-in users who still have incomplete daily quests → /routine
 *  - weekly → opted-in users → /recap
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return fail("Unauthorized", 401);
  }

  const type = new URL(request.url).searchParams.get("type") === "weekly" ? "weekly" : "daily";
  const admin = createAdminClient();

  const payload: PushPayload =
    type === "weekly"
      ? { title: "📈 Ton récap de la semaine", body: "Viens voir ta progression de la semaine.", url: "/recap", tag: "weekly" }
      : { title: "🗓️ Tes quêtes quotidiennes t'attendent", body: "Termine-les pour garder ta série 🔥", url: "/routine", tag: "daily" };

  // Opted-in users (master toggle + the per-type toggle).
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, pref_notif, pref_daily, pref_weekly");
  const eligible = (profiles ?? [])
    .filter((p) => p.pref_notif && (type === "weekly" ? p.pref_weekly : p.pref_daily))
    .map((p) => p.id);

  let targetIds = eligible;
  if (type === "daily" && eligible.length) {
    // Only users who still have at least one undone daily quest.
    const { data: routines } = await admin
      .from("routines")
      .select("user_id, done, frequency")
      .in("user_id", eligible)
      .eq("frequency", "daily");
    const pending = new Set<string>();
    for (const r of routines ?? []) if (!r.done) pending.add(r.user_id);
    targetIds = eligible.filter((id) => pending.has(id));
  }

  if (targetIds.length === 0) return ok({ type, sent: 0, targets: 0 });

  const { data: subs } = await admin.from("push_subscriptions").select("*").in("user_id", targetIds);
  let sent = 0;
  let pruned = 0;
  for (const s of subs ?? []) {
    const r = await sendPush(s.subscription as unknown as PushSubscription, payload);
    if (r.ok) sent++;
    else if (r.gone) {
      await admin.from("push_subscriptions").delete().eq("id", s.id);
      pruned++;
    }
  }
  return ok({ type, sent, pruned, targets: targetIds.length });
}
