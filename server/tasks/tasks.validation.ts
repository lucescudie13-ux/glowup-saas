import { z } from "zod";
export const taskScopeSchema = z.enum(["today", "other"]);
export const taskStatusSchema = z.enum(["todo", "doing", "done"]);
// Deadline: ISO datetime string, or null to clear. Coerces "" to null.
const deadlineSchema = z
  .string()
  .trim()
  .datetime({ offset: true })
  .nullable()
  .optional()
  .or(z.literal("").transform(() => null));
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  minutes: z.coerce.number().int().min(0).default(0),
  category: z.string().trim().min(1).default("Général"),
  position: z.coerce.number().int().min(0).optional(),
  scope: taskScopeSchema.optional(),
  deadline: deadlineSchema,
  urgent: z.boolean().optional(),
  important: z.boolean().optional(),
  status: taskStatusSchema.optional(),
});
export const updateTaskSchema = z.object({
  name: z.string().trim().min(1).optional(),
  minutes: z.coerce.number().int().min(0).optional(),
  category: z.string().trim().min(1).optional(),
  done: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
  scope: taskScopeSchema.optional(),
  deadline: deadlineSchema,
  urgent: z.boolean().optional(),
  important: z.boolean().optional(),
  status: taskStatusSchema.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
