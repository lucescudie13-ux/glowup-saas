import { getCurrentUser } from "@/lib/supabase/server";
import { foodsService } from "@/server/foods/foods.service";
import { nutritionGoalsService } from "@/server/nutrition_goals/nutrition_goals.service";
import { PageHead } from "@/components/ui/page-head";
import { NutritionManager } from "@/components/features/nutrition-manager";
import { todayISO } from "@/lib/utils";

export default async function NutritionPage() {
  const user = await getCurrentUser();
  const [goals, foods] = await Promise.all([
    nutritionGoalsService.get(user!.id),
    foodsService.list(user!.id, todayISO()),
  ]);
  return (
    <div className="page section active">
      <PageHead title="Alimentation" sub="Suis tes calories et macros au quotidien." />
      <NutritionManager initialGoals={goals} initialFoods={foods} />
    </div>
  );
}
