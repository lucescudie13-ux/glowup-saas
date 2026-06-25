import { z } from "zod";
export const objectivePeriodSchema = z.enum(["monthly", "yearly"]);
export const objectiveDetailsSchema = z.object({
  actions: z.string().default(""),
  details: z.string().default(""),
}).partial().passthrough();
export const createObjectiveSchema = z.object({
  period: objectivePeriodSchema,
  name: z.string().trim().min(1, "Le nom est requis."),
  actions: z.string().trim().default(""),
  position: z.coerce.number().int().min(0).optional(),
});
export const updateObjectiveSchema = z.object({
  name: z.string().trim().min(1).optional(),
  actions: z.string().optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  details: objectiveDetailsSchema.optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
