import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { statsService } from "@/server/stats/stats.service";
import { createStatSchema } from "@/server/stats/stats.validation";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  return ok(await statsService.list(user.id));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createStatSchema);
  if (parsed.response) return parsed.response;
  return created(await statsService.createCustom(user.id, parsed.data));
}
