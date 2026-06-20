// server/actions/actions.service.ts
import { actionsRepository as repo } from "./actions.repository";
import { statsService } from "@/server/stats/stats.service";
import { userService } from "@/server/users/user.service";
import { actionXp, levelFromXp } from "@/lib/utils";
import type { CreateActionInput } from "./actions.validation";
import type { Action, Stat } from "@/types";

export const actionsService = {
  list: (userId: string): Promise<Action[]> => repo.list(userId),

  /**
   * Core RPG loop, fully server-side:
   * 1) keep only non-zero deltas
   * 2) apply them to the user's stats (clamped 0..100)
   * 3) record the action in history
   * 4) bump the streak
   * 5) award XP (= sum of positive deltas) and report level / level-up
   */
  async record(
    userId: string,
    input: CreateActionInput
  ): Promise<{
    action: Action;
    stats: Stat[];
    streak: number;
    xpGained: number;
    xp: number;
    level: number;
    leveledUp: boolean;
  }> {
    const deltas: Record<string, number> = {};
    for (const [k, v] of Object.entries(input.deltas)) {
      if (v !== 0) deltas[k] = v;
    }

    const profileBefore = await userService.getProfile(userId);
    const levelBefore = levelFromXp(profileBefore?.xp ?? 0).level;

    const stats = await statsService.applyDeltas(userId, deltas);
    const action = await repo.create(userId, { name: input.name, deltas });
    const streak = await userService.bumpStreak(userId);

    const xpGained = actionXp(deltas);
    const xp = xpGained > 0 ? await userService.addXp(userId, xpGained) : profileBefore?.xp ?? 0;
    const level = levelFromXp(xp).level;

    return { action, stats, streak, xpGained, xp, level, leveledUp: level > levelBefore };
  },

  remove: (userId: string, id: string) => repo.remove(userId, id),

  /** Clears the whole history for the user. */
  async clearAll(userId: string): Promise<void> {
    const all = await repo.list(userId);
    for (const a of all) await repo.remove(userId, a.id);
  },
};
