import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { characterLevel } from "@/lib/utils";
import { userService } from "@/server/users/user.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await userService.getProfile(user.id);
  if (!profile) redirect("/login");

  // Level/score derived from the user's stats (read server-side).
  const supabase = await createClient();
  const { data: stats } = await supabase
    .from("stats")
    .select("value")
    .eq("user_id", user.id);
  const { level, avg } = characterLevel(stats ?? []);

  return (
    <AppShell profile={profile} level={level} score={avg}>
      {children}
    </AppShell>
  );
}
