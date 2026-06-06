import { getCurrentUser } from "@/lib/supabase/server";
import { workoutsService } from "@/server/workouts/workouts.service";
import { PageHead } from "@/components/ui/page-head";
import { TrainingManager } from "@/components/features/training-manager";

export default async function TrainingPage() {
  const user = await getCurrentUser();
  const workouts = await workoutsService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Entraînement" sub="Muscu, course et boxe — une seule timeline." />
      <TrainingManager initialWorkouts={workouts} />
    </div>
  );
}
