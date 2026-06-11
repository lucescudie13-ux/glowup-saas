import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { foodsService } from "@/server/foods/foods.service";
import { nutritionGoalsService } from "@/server/nutrition_goals/nutrition_goals.service";
import { PageHead } from "@/components/ui/page-head";
import { NutritionManager } from "@/components/features/nutrition-manager";
import { addDaysISO, todayISO } from "@/lib/utils";

const CHART_DAYS = 14;

export default async function NutritionPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;
  const today = todayISO();
  const chartStart = addDaysISO(today, -(CHART_DAYS - 1));

  const [goals, foods, history] = await Promise.all([
    nutritionGoalsService.get(uid),
    foodsService.list(uid, today),
    supabase.from("foods").select("calories, food_date").eq("user_id", uid).gte("food_date", chartStart),
  ]);

  // Aggregate calories per day for the chart (fill empty days with 0).
  const byDay = new Map<string, number>();
  for (const f of history.data ?? []) {
    byDay.set(f.food_date, (byDay.get(f.food_date) ?? 0) + Number(f.calories || 0));
  }
  const caloriesByDay = Array.from({ length: CHART_DAYS }, (_, i) => {
    const date = addDaysISO(chartStart, i);
    return { date, calories: Math.round(byDay.get(date) ?? 0) };
  });

  return (
    <div className="page section active">
      <PageHead title="Alimentation" sub="Suis tes calories et macros, jour par jour." />
      <NutritionManager
        initialGoals={goals}
        initialFoods={foods}
        today={today}
        caloriesByDay={caloriesByDay}
      />
    </div>
  );
}
