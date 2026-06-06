import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { objectivesService } from "@/server/objectives/objectives.service";
import { createObjectiveSchema, objectivePeriodSchema } from "@/server/objectives/objectives.validation";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const periodParam = request.nextUrl.searchParams.get("period");
  const period = periodParam ? objectivePeriodSchema.safeParse(periodParam) : null;
  return ok(await objectivesService.list(user.id, period?.success ? period.data : undefined));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createObjectiveSchema);
  if (parsed.response) return parsed.response;
  return created(await objectivesService.create(user.id, parsed.data));
}
