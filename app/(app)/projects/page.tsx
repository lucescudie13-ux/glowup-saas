import { getCurrentUser } from "@/lib/supabase/server";
import { projectsService } from "@/server/projects/projects.service";
import { PageHead } from "@/components/ui/page-head";
import { ProjectsManager } from "@/components/features/projects-manager";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const items = await projectsService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Projets en cours" sub="Tes chantiers de fond, suivis en pourcentage." />
      <ProjectsManager initialItems={items} />
    </div>
  );
}
