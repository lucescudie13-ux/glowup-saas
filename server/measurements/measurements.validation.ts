import { z } from "zod";

const metric = z.coerce.number().min(0).max(999).nullable().optional();

export const createMeasurementSchema = z.object({
  measure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").optional(),
  weight: metric,
  body_fat: metric,
  arm: metric,
  leg: metric,
  waist: metric,
  shoulder: metric,
  chest: metric,
  note: z.string().trim().default(""),
});

export const updateMeasurementSchema = z.object({
  measure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").optional(),
  weight: metric,
  body_fat: metric,
  arm: metric,
  leg: metric,
  waist: metric,
  shoulder: metric,
  chest: metric,
  note: z.string().trim().optional(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;
