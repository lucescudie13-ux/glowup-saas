import { z } from "zod";
export const createStatSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  value: z.coerce.number().int().min(0).max(100).default(50),
});
export const updateStatSchema = z.object({
  name: z.string().trim().min(1).optional(),
  value: z.coerce.number().int().min(0).max(100).optional(),
});
export type CreateStatInput = z.infer<typeof createStatSchema>;
export type UpdateStatInput = z.infer<typeof updateStatSchema>;
