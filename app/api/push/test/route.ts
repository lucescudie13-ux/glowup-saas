import { ok, requireUser } from "@/server/shared/api";
import { pushService } from "@/server/push/push.service";
import { sendPush } from "@/lib/push";
import type { PushSubscription } from "web-push";

export async function POST() {
  const { user, response } = await requireUser();
  if (!user) return response;
  const subs = await pushService.listForUser(user.id);
  let sent = 0;
  for (const s of subs) {
    const r = await sendPush(s.subscription as unknown as PushSubscription, {
      title: "🔔 Test Glow Up",
      body: "Tes notifications fonctionnent !",
      url: "/dashboard",
      tag: "test",
    });
    if (r.ok) sent++;
    else if (r.gone) await pushService.remove(user.id, s.endpoint);
  }
  return ok({ sent });
}
