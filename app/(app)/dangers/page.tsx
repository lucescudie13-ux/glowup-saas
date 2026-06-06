import { getCurrentUser } from "@/lib/supabase/server";
import { dangersService } from "@/server/dangers/dangers.service";
import { PageHead } from "@/components/ui/page-head";
import { DangersManager } from "@/components/features/dangers-manager";

export default async function DangersPage() {
  const user = await getCurrentUser();
  const items = await dangersService.list(user!.id);
  return (
    <div className="page section active">
      <PageHead title="Dangers" sub="Ce qui menace ta progression — à surveiller." />
      <DangersManager initialItems={items} />
    </div>
  );
}
