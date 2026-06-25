import { z } from "zod";
export const statCategorySchema = z.enum(["physique", "mental", "personnel", "energie"]);
export const createStatSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  value: z.coerce.number().int().min(0).max(100).default(50),
  category: statCategorySchema.default("personnel"),
});
export const updateStatSchema = z.object({
  name: z.string().trim().min(1).optional(),
  value: z.coerce.number().int().min(0).max(100).optional(),
  category: statCategorySchema.optional(),
});
export type CreateStatInput = z.infer<typeof createStatSchema>;
export type UpdateStatInput = z.infer<typeof updateStatSchema>;
