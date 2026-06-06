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
};
