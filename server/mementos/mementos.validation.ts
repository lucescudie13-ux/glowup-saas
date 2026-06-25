import { z } from "zod";
const expiresAt = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").nullable().optional();
export const createMementoSchema = z.object({
  name: z.string().trim().min(1, "Écris ta phrase memento."),
  expires_at: expiresAt,
  position: z.coerce.number().int().min(0).optional(),
});
export const updateMementoSchema = z.object({
  name: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
  expires_at: expiresAt,
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateMementoInput = z.infer<typeof createMementoSchema>;
export type UpdateMementoInput = z.infer<typeof updateMementoSchema>;
