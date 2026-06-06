import { z } from "zod";
export const createRoutineSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  minutes: z.coerce.number().int().min(1, "Indique une durée en minutes."),
  category: z.string().trim().min(1).default("Général"),
});
export const updateRoutineSchema = z.object({
  name: z.string().trim().min(1).optional(),
  minutes: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
});
export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
