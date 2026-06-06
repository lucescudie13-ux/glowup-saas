// server/nutrition_goals/nutrition_goals.service.ts
import { nutritionGoalsRepository as repo } from "./nutrition_goals.repository";
import type { UpdateNutritionGoalsInput } from "./nutrition_goals.validation";

export const nutritionGoalsService = {
  get: (userId: string) => repo.get(userId),
  set: (userId: string, input: UpdateNutritionGoalsInput) => repo.upsert(userId, input),
};
