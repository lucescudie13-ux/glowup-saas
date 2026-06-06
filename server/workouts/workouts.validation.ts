import { z } from "zod";
export const workoutTypeSchema = z.enum(["strength", "run", "boxing"]);

export const strengthDataSchema = z.object({
  exercise: z.string().trim().min(1, "Écris le nom de l’exercice."),
  weight: z.coerce.number().min(0).default(0),
  reps: z.coerce.number().int().min(1, "Indique le nombre de répétitions."),
  sets: z.coerce.number().int().min(1).default(1),
  rest: z.coerce.number().min(0).default(0),
});
export const runDataSchema = z.object({
  distance: z.coerce.number().positive("Indique la distance en km."),
  seconds: z.coerce.number().int().positive("Indique le temps de course."),
  note: z.string().trim().default(""),
});
export const boxingDataSchema = z.object({
  minutes: z.coerce.number().positive("Indique la durée."),
  type: z.string().trim().min(1).default("Sac"),
  intensity: z.coerce.number().int().min(1).max(5).default(3),
  note: z.string().trim().default(""),
});

export const createWorkoutSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("strength"), workout_date: z.string().date().optional(), data: strengthDataSchema }),
  z.object({ type: z.literal("run"), workout_date: z.string().date().optional(), data: runDataSchema }),
  z.object({ type: z.literal("boxing"), workout_date: z.string().date().optional(), data: boxingDataSchema }),
]);
export type CreateWorkoutInput = z.infer<typeof createWorkoutSchema>;
