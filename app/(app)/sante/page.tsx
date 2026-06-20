import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { sleepService } from "@/server/sleep/sleep.service";
import { PageHead } from "@/components/ui/page-head";
import { SleepManager } from "@/components/features/sleep-manager";
import type { SleepEntry } from "@/types";

export default async function SantePage() {
  const user = await getCurrentUser();

  // The sleep table may not exist yet (migration not applied). Degrade
  // gracefully instead of crashing the whole page with an application error.
  let entries: SleepEntry[] = [];
  let dbReady = true;
  try {
    entries = await sleepService.list(user!.id);
  } catch {
    dbReady = false;
  }

  return (
    <div className="page section active">
      <PageHead title="Santé" sub="Ton sommeil et ton alimentation, réunis." />

      {/* ===== Alimentation (sous Santé) ===== */}
      <Link href="/nutrition" className="card health-link" style={{ textDecoration: "none", marginBottom: 16 }}>
        <div className="health-link-icon">🍽️</div>
        <div style={{ flex: 1 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Alimentation</h2>
          <p className="card-sub" style={{ margin: "2px 0 0" }}>Calories, macros et journal des repas.</p>
        </div>
        <span className="health-link-arrow">→</span>
      </Link>

      {dbReady ? (
        <SleepManager initialEntries={entries} />
      ) : (
        <div className="card">
          <h2 className="card-title">😴 Sommeil</h2>
          <p className="card-sub" style={{ marginTop: 6 }}>
            Le suivi du sommeil n’est pas encore prêt : la base de données doit être mise à jour
            (migration <code>011_health_sleep</code>). Lance <code>npm run db:migrate</code>, puis recharge la page.
          </p>
        </div>
      )}
    </div>
  );
}
