import type { NextRequest } from "next/server";
import { ok, requireUser, parseBody } from "@/server/shared/api";
import { pushService } from "@/server/push/push.service";
import { pushSubscriptionSchema } from "@/server/push/push.validation";

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, pushSubscriptionSchema);
  if (parsed.response) return parsed.response;
  await pushService.save(user.id, parsed.data);
  return ok({ subscribed: true });
}
