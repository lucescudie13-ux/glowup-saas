import { z } from "zod";
export const financeTypeSchema = z.enum(["income", "expense"]);
export const createFinanceEntrySchema = z.object({
  type: financeTypeSchema,
  name: z.string().trim().min(1, "Le nom est requis."),
  amount: z.coerce.number().positive("Indique un montant valide."),
  category: z.string().trim().min(1).default("Autre"),
  entry_date: z.string().date().optional(),
});
export const updateFinanceEntrySchema = z.object({
  name: z.string().trim().min(1).optional(),
  amount: z.coerce.number().positive().optional(),
  category: z.string().trim().min(1).optional(),
  entry_date: z.string().date().optional(),
});
export type CreateFinanceEntryInput = z.infer<typeof createFinanceEntrySchema>;
export type UpdateFinanceEntryInput = z.infer<typeof updateFinanceEntrySchema>;
