import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { userService } from "@/server/users/user.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await userService.getProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <AppShell profile={profile}>{children}</AppShell>
  );
}
