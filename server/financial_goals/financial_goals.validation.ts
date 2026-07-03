import { z } from "zod";
export const financialKindSchema = z.enum(["goal", "obligation"]);

// Accepts 'YYYY-MM-DD', or "" / null to clear the deadline.
const deadlineSchema = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (YYYY-MM-DD)."), z.literal(""), z.null()])
  .transform((v) => (v ? v : null))
  .optional();

// A compact data URL (or "" to clear). Cap length to keep rows sane.
const imageSchema = z.string().max(3_000_000).optional();

export const createFinancialGoalSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  target: z.coerce.number().positive("Indique le montant nécessaire."),
  saved: z.coerce.number().min(0).default(0),
  description: z.string().trim().optional(),
  kind: financialKindSchema.default("goal"),
  deadline: deadlineSchema,
  image: imageSchema,
  position: z.coerce.number().int().min(0).optional(),
});
export const updateFinancialGoalSchema = z.object({
  name: z.string().trim().min(1).optional(),
  target: z.coerce.number().positive().optional(),
  saved: z.coerce.number().min(0).optional(),
  description: z.string().trim().optional(),
  kind: financialKindSchema.optional(),
  deadline: deadlineSchema,
  image: imageSchema,
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateFinancialGoalInput = z.infer<typeof createFinancialGoalSchema>;
export type UpdateFinancialGoalInput = z.infer<typeof updateFinancialGoalSchema>;
