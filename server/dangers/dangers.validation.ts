import { z } from "zod";
export const createDangerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  category: z.string().trim().min(1).default("Autre"),
  impact: z.coerce.number().int().min(1).max(5).default(3),
});
export const updateDangerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  impact: z.coerce.number().int().min(1).max(5).optional(),
});
export type CreateDangerInput = z.infer<typeof createDangerSchema>;
export type UpdateDangerInput = z.infer<typeof updateDangerSchema>;
