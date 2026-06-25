import { z } from "zod";

export const createReflectionSchema = z.object({
  title: z.string().trim().max(200).default(""),
  body: z.string().trim().default(""),
  topic: z.string().trim().min(1).default("Général"),
  pinned: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export const updateReflectionSchema = z.object({
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().optional(),
  topic: z.string().trim().min(1).optional(),
  pinned: z.boolean().optional(),
  position: z.coerce.number().int().min(0).optional(),
});

export type CreateReflectionInput = z.infer<typeof createReflectionSchema>;
export type UpdateReflectionInput = z.infer<typeof updateReflectionSchema>;
