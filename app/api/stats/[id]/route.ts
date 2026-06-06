import type { NextRequest } from "next/server";
import { ok, fail, requireUser, parseBody } from "@/server/shared/api";
import { statsService } from "@/server/stats/stats.service";
import { updateStatSchema } from "@/server/stats/stats.validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  const parsed = await parseBody(request, updateStatSchema);
  if (parsed.response) return parsed.response;
  const row = await statsService.update(user.id, id, parsed.data);
  return row ? ok(row) : fail("Introuvable.", 404);
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const { id } = await ctx.params;
  try {
    const okDel = await statsService.removeCustom(user.id, id);
    return okDel ? ok({ id, deleted: true }) : fail("Introuvable.", 404);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erreur.", 400);
  }
}
