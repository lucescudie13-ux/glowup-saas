import { z } from "zod";
export const routineFrequencySchema = z.enum(["daily", "weekly", "monthly"]);
export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  description: z.string().trim().max(500).optional(),
  // Routines don't collect a duration in the UI; the DB defaults it to 1.
  minutes: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).default("Général"),
  position: z.coerce.number().int().min(0).optional(),
  frequency: routineFrequencySchema.optional(),
});
export const updateRoutineSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().max(500).optional(),
  minutes: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
  frequency: routineFrequencySchema.optional(),
});
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
