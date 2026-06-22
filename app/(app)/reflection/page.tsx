import { getCurrentUser } from "@/lib/supabase/server";
import { reflectionsService } from "@/server/reflections/reflections.service";
import { PageHead } from "@/components/ui/page-head";
import { ReflectionsManager } from "@/components/features/reflections-manager";
import type { Reflection } from "@/types";

export default async function ReflectionPage() {
  const user = await getCurrentUser();
  const items = (await reflectionsService.list(user!.id)) as Reflection[];
  return (
    <div className="page section active">
      <PageHead title="Réflexion" sub="Tes notes et les sujets que tu veux creuser." />
      <ReflectionsManager initialItems={items} />
    </div>
  );
}
