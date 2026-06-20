// server/users/user.repository.ts
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import type { UpdateProfileInput } from "./user.validation";

export const userRepository = {
  async getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, patch: UpdateProfileInput): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async setStreak(userId: string, count: number, lastActiveDay: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ streak_count: count, streak_last_active_day: lastActiveDay })
      .eq("id", userId);
    if (error) throw error;
  },

  async setRoutineStreak(userId: string, count: number, lastDay: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ routine_streak_count: count, routine_streak_last_day: lastDay })
      .eq("id", userId);
    if (error) throw error;
  },

  /** Adds `amount` XP (clamped ≥ 0) and returns the new total. */
  async addXp(userId: string, amount: number): Promise<number> {
    const supabase = await createClient();
    const current = await this.getProfile(userId);
    const next = Math.max(0, (current?.xp ?? 0) + Math.max(0, Math.round(amount)));
    const { error } = await supabase.from("profiles").update({ xp: next }).eq("id", userId);
    if (error) throw error;
    return next;
  },
};
