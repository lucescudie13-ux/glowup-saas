import type { NextRequest } from "next/server";
import { ok, created, requireUser, parseBody } from "@/server/shared/api";
import { foodsService } from "@/server/foods/foods.service";
import { createFoodSchema } from "@/server/foods/foods.validation";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const date = request.nextUrl.searchParams.get("date") ?? undefined;
  return ok(await foodsService.list(user.id, date));
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, createFoodSchema);
  if (parsed.response) return parsed.response;
  return created(await foodsService.create(user.id, parsed.data));
}
