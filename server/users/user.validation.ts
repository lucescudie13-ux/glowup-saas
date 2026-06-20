import { z } from "zod";
export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).optional(),
  avatar: z.string().trim().min(1).optional(),
  pref_notif: z.boolean().optional(),
  pref_daily: z.boolean().optional(),
  routine_deadline: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM).")
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
