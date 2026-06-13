import { z } from "zod";
export const createFinancialGoalSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  target: z.coerce.number().positive("Indique le montant nécessaire."),
  saved: z.coerce.number().min(0).default(0),
  description: z.string().trim().optional(),
});
export const updateFinancialGoalSchema = z.object({
  name: z.string().trim().min(1).optional(),
  target: z.coerce.number().positive().optional(),
  saved: z.coerce.number().min(0).optional(),
  description: z.string().trim().optional(),
});
export type CreateFinancialGoalInput = z.infer<typeof createFinancialGoalSchema>;
export type UpdateFinancialGoalInput = z.infer<typeof updateFinancialGoalSchema>;
