import { z } from "zod";
export const createDangerSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  description: z.string().trim().default(""),
  category: z.string().trim().min(1).default("Autre"),
  impact: z.coerce.number().int().min(1).max(5).default(3),
  position: z.coerce.number().int().min(0).optional(),
});
export const updateDangerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1).optional(),
  impact: z.coerce.number().int().min(1).max(5).optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateDangerInput = z.infer<typeof createDangerSchema>;
export type UpdateDangerInput = z.infer<typeof updateDangerSchema>;
