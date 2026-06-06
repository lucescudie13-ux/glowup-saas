import { getCurrentUser } from "@/lib/supabase/server";
import { statsService } from "@/server/stats/stats.service";
import { PageHead } from "@/components/ui/page-head";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ActionRecorder } from "@/components/features/action-recorder";
import { CustomStatsManager } from "@/components/features/custom-stats-manager";

export default async function StatsPage() {
  const user = await getCurrentUser();
  const stats = await statsService.list(user!.id);

  return (
    <div className="page section active">
      <PageHead title="Statistiques" sub="Tes 8 caractéristiques évoluent selon tes actions." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h2 className="card-title">📊 Caractéristiques</h2>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {stats.map((s) => (
            <div key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{s.name}</span>
                <span className="card-sub">{s.value}/100</span>
              </div>
              <ProgressBar value={s.value} />
            </div>
          ))}
        </div>
      </div>

      <ActionRecorder stats={stats} />
      <CustomStatsManager stats={stats} />
    </div>
  );
}
