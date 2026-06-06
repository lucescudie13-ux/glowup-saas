// server/nutrition_goals/nutrition_goals.repository.ts
import { createClient } from "@/lib/supabase/server";
import type { NutritionGoals } from "@/types";
import type { UpdateNutritionGoalsInput } from "./nutrition_goals.validation";

export const nutritionGoalsRepository = {
  async get(userId: string): Promise<NutritionGoals | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async upsert(userId: string, input: UpdateNutritionGoalsInput): Promise<NutritionGoals> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("nutrition_goals")
      .upsert({ user_id: userId, ...input })
      .select("*")
      .single();
    if (error) throw error;
    return data;
  },
};
