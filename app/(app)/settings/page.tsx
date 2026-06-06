import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { SettingsForm } from "@/components/features/settings-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = await userService.getProfile(user!.id);
  if (!profile) redirect("/login");
  return (
    <div className="page section active">
      <PageHead title="Paramètres" sub="Ton profil, tes préférences et tes données." />
      <SettingsForm profile={profile} />
    </div>
  );
}
