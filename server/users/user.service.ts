// server/users/user.service.ts
import { userRepository as repo } from "./user.repository";
import type { UpdateProfileInput } from "./user.validation";

/** Local YYYY-MM-DD for a date (server-side, UTC). */
function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export const userService = {
  getProfile: (userId: string) => repo.getProfile(userId),

  updateProfile: (userId: string, patch: UpdateProfileInput) =>
    repo.updateProfile(userId, patch),

  /**
   * Streak logic (ported from the prototype's bumpStreak):
   * - same day  -> no change
   * - yesterday -> +1
   * - otherwise -> reset to 1
   * Returns the new streak count.
   */
  async bumpStreak(userId: string): Promise<number> {
    const profile = await repo.getProfile(userId);
    const today = dayKey();
    if (!profile) return 0;
    if (profile.streak_last_active_day === today) return profile.streak_count;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dayKey(yesterday);

    const count = profile.streak_last_active_day === yKey ? profile.streak_count + 1 : 1;
    await repo.setStreak(userId, count, today);
    return count;
  },
};
