import { getCurrentUser } from "@/lib/supabase/server";
import { objectivesService } from "@/server/objectives/objectives.service";
import { projectsService } from "@/server/projects/projects.service";
import { PageHead } from "@/components/ui/page-head";
import { ObjectivesManager } from "@/components/features/objectives-manager";
import { ProjectsManager } from "@/components/features/projects-manager";
import { ObjectivesTabs } from "@/components/features/objectives-tabs";

export default async function ObjectivesPage({ searchParams }: { searchParams: { view?: string } }) {
  const user = await getCurrentUser();
  const uid = user!.id;
  const [objectives, projects] = await Promise.all([
    objectivesService.list(uid),
    projectsService.list(uid),
  ]);
  return (
    <div className="page section active">
      <PageHead title="Objectifs & projets" sub="Tes objectifs du mois et de l’année, et tes projets de fond." />
      <ObjectivesTabs
        initial={searchParams?.view === "projets" ? "projets" : "objectifs"}
        objectives={<ObjectivesManager initialItems={objectives} />}
        projects={<ProjectsManager initialItems={projects} />}
      />
    </div>
  );
}
