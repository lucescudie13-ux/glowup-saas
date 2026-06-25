import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { userService } from "@/server/users/user.service";
import { statsService } from "@/server/stats/stats.service";
import { settleDay } from "@/server/settlement/settlement.service";
import { categoryAverage } from "@/lib/utils";

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

  // Category gauges for the sidebar profile widget.
  const stats = await statsService.list(user.id);
  const sidebarCategories = [
    { label: "Physique", value: categoryAverage(stats, "physique"), color: "#e5484d" },
    { label: "Mental", value: categoryAverage(stats, "mental"), color: "#3e63dd" },
    { label: "Personnel", value: categoryAverage(stats, "personnel"), color: "#8e4ec6" },
    { label: "Énergie", value: categoryAverage(stats, "energie"), color: "#f5a623" },
  ];

  return (
    <AppShell profile={profile} categories={sidebarCategories}>{children}</AppShell>
  );
}
