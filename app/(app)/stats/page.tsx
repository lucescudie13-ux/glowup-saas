import { redirect } from "next/navigation";

// Statistiques was merged into Personnage. Keep this route as a redirect
// so any old link/bookmark still lands in the right place.
export default function StatsPage() {
  redirect("/character");
}
