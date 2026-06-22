import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { userService } from "@/server/users/user.service";
import { settleDay } from "@/server/settlement/settlement.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await userService.getProfile(user.id);
  if (!profile) redirect("/login");

  // Daily settlement: penalise tasks left undone on previous days. Idempotent
  // per day; never block rendering if it fails.
  try {
    await settleDay(user.id);
  } catch {
    /* ignore — settlement is best-effort */
  }

  return (
    <AppShell profile={profile}>{children}</AppShell>
  );
}
