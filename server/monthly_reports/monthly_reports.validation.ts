import { z } from "zod";

/** A month is stored as 'YYYY-MM'. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mois invalide (attendu YYYY-MM).");

export const upsertMonthlyReportSchema = z.object({
  month: monthKeySchema,
  review_notes: z.string().trim().max(5000).optional(),
  next_goals: z.string().trim().max(5000).optional(),
});

export type UpsertMonthlyReportInput = z.infer<typeof upsertMonthlyReportSchema>;
