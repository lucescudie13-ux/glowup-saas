import { z } from "zod";
export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1).optional(),
  avatar: z.string().trim().min(1).optional(),
  pref_notif: z.boolean().optional(),
  pref_daily: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
