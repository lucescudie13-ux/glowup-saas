import { z } from "zod";
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  description: z.string().trim().optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  description: z.string().trim().optional(),
  position: z.coerce.number().int().min(0).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
