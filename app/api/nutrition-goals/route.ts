import type { NextRequest } from "next/server";
import { ok, requireUser, parseBody } from "@/server/shared/api";
import { nutritionGoalsService } from "@/server/nutrition_goals/nutrition_goals.service";
import { updateNutritionGoalsSchema } from "@/server/nutrition_goals/nutrition_goals.validation";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;
  return ok(await nutritionGoalsService.get(user.id));
}

export async function PUT(request: NextRequest) {
  const { user, response } = await requireUser();
  if (!user) return response;
  const parsed = await parseBody(request, updateNutritionGoalsSchema);
  if (parsed.response) return parsed.response;
  return ok(await nutritionGoalsService.set(user.id, parsed.data));
}
