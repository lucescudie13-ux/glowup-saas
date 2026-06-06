import type { NextRequest } from "next/server";
import { ok, requireUser } from "@/server/shared/api";
import { actionsService } from "@/server/actions/actions.service";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  await actionsService.remove(user.id, id);
  return ok({ id, deleted: true });
}
