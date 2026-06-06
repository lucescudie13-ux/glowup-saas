import { z } from "zod";
export const createMementoSchema = z.object({
  name: z.string().trim().min(1, "Écris ta phrase memento."),
});
export const updateMementoSchema = z.object({
  name: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
});
export type CreateMementoInput = z.infer<typeof createMementoSchema>;
export type UpdateMementoInput = z.infer<typeof updateMementoSchema>;
