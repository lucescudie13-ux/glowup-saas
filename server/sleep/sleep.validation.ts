import { z } from "zod";
export const sleepKindSchema = z.enum(["nuit", "recup"]);
export const createSleepSchema = z.object({
  sleep_date: z.string().date().optional(),
  hours: z.coerce.number().min(0, "Heures invalides.").max(24, "24 h maximum."),
  kind: sleepKindSchema.optional(),
  note: z.string().trim().optional(),
});
export const updateSleepSchema = createSleepSchema.partial();
export type CreateSleepInput = z.infer<typeof createSleepSchema>;
export type UpdateSleepInput = z.infer<typeof updateSleepSchema>;
