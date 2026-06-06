import { z } from "zod";
export const updateNutritionGoalsSchema = z.object({
  calories: z.coerce.number().int().min(0),
  protein: z.coerce.number().int().min(0),
  carbs: z.coerce.number().int().min(0),
  fat: z.coerce.number().int().min(0),
});
export type UpdateNutritionGoalsInput = z.infer<typeof updateNutritionGoalsSchema>;
