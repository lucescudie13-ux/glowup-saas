import { z } from "zod";
export const createFoodSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  meal: z.string().trim().min(1).default("Collation"),
  calories: z.coerce.number().min(0).default(0),
  protein: z.coerce.number().min(0).default(0),
  carbs: z.coerce.number().min(0).default(0),
  fat: z.coerce.number().min(0).default(0),
  food_date: z.string().date().optional(),
});
export const updateFoodSchema = createFoodSchema.partial();
export type CreateFoodInput = z.infer<typeof createFoodSchema>;
export type UpdateFoodInput = z.infer<typeof updateFoodSchema>;
