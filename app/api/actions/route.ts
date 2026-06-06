import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { actionsService } from "@/server/actions/actions.service";
import { createActionSchema } from "@/server/actions/actions.validation";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  return ok(await actionsService.list(user.id));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createActionSchema);
  if (parsed.response) return parsed.response;
  return created(await actionsService.record(user.id, parsed.data));
}

// DELETE on the collection clears the whole history.
export async function DELETE() {
  const { user, response } = await requireUser();
  if (!user) return response;
  await actionsService.clearAll(user.id);
  return ok({ cleared: true });
}
