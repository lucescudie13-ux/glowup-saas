import { getCurrentUser } from "@/lib/supabase/server";
import { statsService } from "@/server/stats/stats.service";
import { userService } from "@/server/users/user.service";
import { PageHead } from "@/components/ui/page-head";
import { ProgressBar } from "@/components/ui/progress-bar";
import { characterLevel } from "@/lib/utils";

export default async function CharacterPage() {
  const user = await getCurrentUser();
  const [stats, profile] = await Promise.all([
    statsService.list(user!.id),
    userService.getProfile(user!.id),
  ]);
  const { avg, level, levelProgress } = characterLevel(stats);

  return (
    <div className="page section active">
      <PageHead title="Personnage" sub="La fiche de ton avatar de vie réelle." />

      <div className="card" style={{ marginBottom: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ fontSize: 52 }}>{profile?.avatar ?? "🧍‍♂️"}</div>
        <div style={{ flex: 1 }}>
          <h2 className="card-title" style={{ margin: 0 }}>{profile?.display_name ?? "Mon perso"}</h2>
          <p className="card-sub" style={{ margin: "4px 0 8px" }}>
            Niveau {level} · Score {avg}/100
          </p>
          <ProgressBar value={levelProgress} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2 className="card-title">Caractéristiques</h2>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {stats.map((s) => (
            <div key={s.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span>{s.name}{s.is_custom ? " ✨" : ""}</span>
                <span className="card-sub">{s.value}/100</span>
              </div>
              <ProgressBar value={s.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
