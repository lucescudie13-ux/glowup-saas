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
      <p className="card-sub" style={{ marginTop: 28, textAlign: "center", opacity: 0.6, fontSize: 12 }}>
        Emblème adapté de « eagle-emblem » par Lorc —{" "}
        <a href="https://game-icons.net" target="_blank" rel="noreferrer">game-icons.net</a> —{" "}
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.
      </p>
    </div>
  );
}
