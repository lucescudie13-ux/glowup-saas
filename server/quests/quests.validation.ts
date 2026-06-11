import { z } from "zod";
export const createQuestSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  category: z.string().trim().min(1).default("Général"),
  position: z.coerce.number().int().min(0).optional(),
});
export const updateQuestSchema = z.object({
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;
