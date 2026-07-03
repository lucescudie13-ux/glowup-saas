// server/monthly_reports/monthly_reports.repository.ts
import { createClient } from "@/lib/supabase/server";
import type { MonthlyReport } from "@/types";

export const monthlyReportsRepository = {
  /** All of a user's monthly reports, most recent month first. */
  async list(userId: string): Promise<MonthlyReport[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MonthlyReport[];
  },

  async getByMonth(userId: string, month: string): Promise<MonthlyReport | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as MonthlyReport | null;
  },

  /** Insert-or-update the (user, month) row; only provided fields are written. */
  async upsert(
    userId: string,
    month: string,
    patch: { review_notes?: string; next_goals?: string },
  ): Promise<MonthlyReport> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("monthly_reports")
      .upsert(
        { user_id: userId, month, ...patch, updated_at: new Date().toISOString() },
        { onConflict: "user_id,month" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return data as MonthlyReport;
  },
};
