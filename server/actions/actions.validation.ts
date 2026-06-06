import { z } from "zod";
export const createActionSchema = z.object({
  name: z.string().trim().min(1, "Écris le nom de l’action."),
  // deltas: { statKey: int } — at least one non-zero delta required.
  deltas: z.record(z.string(), z.coerce.number().int())
    .refine((d) => Object.values(d).some((v) => v !== 0), {
      message: "Ajoute au moins un + ou un -.",
    }),
});
export type CreateActionInput = z.infer<typeof createActionSchema>;
