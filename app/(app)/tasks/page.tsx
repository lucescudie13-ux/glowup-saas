import { getCurrentUser } from "@/lib/supabase/server";
import { tasksService } from "@/server/tasks/tasks.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { TasksView } from "@/components/features/tasks-view";
import type { Task } from "@/types";

export default async function TasksPage() {
  const user = await getCurrentUser();
  const [items, profile] = await Promise.all([
    tasksService.listVisible(user!.id) as Promise<Task[]>,
    userService.getProfile(user!.id),
  ]);
  return (
    <div className="page section active">
      <PageHead title="Tâches" sub="Tes tâches du jour, organisées comme tu préfères." />
      <TasksView initialItems={items} initialMode={profile?.tasks_mode ?? "classic"} />
    </div>
  );
}
