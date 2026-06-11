import { z } from "zod";
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  minutes: z.coerce.number().int().min(0).default(0),
  category: z.string().trim().min(1).default("Général"),
  position: z.coerce.number().int().min(0).optional(),
});
export const updateTaskSchema = z.object({
  name: z.string().trim().min(1).optional(),
  minutes: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
