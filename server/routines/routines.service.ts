// server/routines/routines.service.ts
import { routinesRepository as repo } from "./routines.repository";
import { userService } from "@/server/users/user.service";
import type { CreateRoutineInput, UpdateRoutineInput } from "./routines.validation";

export const routinesService = {
  list: (userId: string) => repo.list(userId),
  get: (userId: string, id: string) => repo.getById(userId, id),
  create: (userId: string, input: CreateRoutineInput) => repo.create(userId, input),

  async update(userId: string, id: string, patch: UpdateRoutineInput) {
    // Stamp the completion moment so the quest can be reset at the start of the
    // next period and shown red when a past period ended without it.
    const data: Record<string, unknown> = { ...patch };
    if (patch.done === true) data.completed_at = new Date().toISOString();
    const row = await repo.update(userId, id, data);
    // When a completion toggle leaves the *daily* routine fully done, bump the
    // routine streak (idempotent per day). Best-effort: a failure here must not
    // break the toggle.
    if (patch.done === true) {
      try {
        const all = await repo.list(userId);
        const daily = all.filter((r) => (r.frequency ?? "daily") === "daily");
        if (daily.length > 0 && daily.every((r) => r.done)) {
          await userService.bumpRoutineStreak(userId);
        }
      } catch {
        /* streak is best-effort */
      }
    }
    return row;
  },

  remove: (userId: string, id: string) => repo.remove(userId, id),
};
