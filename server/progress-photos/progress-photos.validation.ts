import { z } from "zod";

export const photoPoseSchema = z.enum(["front", "back", "side"]);

export const createProgressPhotoSchema = z.object({
  photo_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").optional(),
  pose: photoPoseSchema,
  contracted: z.boolean().default(false),
  storage_path: z.string().trim().min(1),
});

export const updateProgressPhotoSchema = z.object({
  photo_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").optional(),
  pose: photoPoseSchema.optional(),
  contracted: z.boolean().optional(),
  storage_path: z.string().trim().min(1).optional(),
});

export type CreateProgressPhotoInput = z.infer<typeof createProgressPhotoSchema>;
export type UpdateProgressPhotoInput = z.infer<typeof updateProgressPhotoSchema>;
