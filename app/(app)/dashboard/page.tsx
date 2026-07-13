import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui/page-head";
import { money, percentage, todayISO, monthLabel, prevMonthKey, monthlySavingNeeded, formatDayLabel } from "@/lib/utils";
import { DashboardCheckList } from "@/components/features/dashboard-check-list";
import { DashboardRoutineTabs } from "@/components/features/dashboard-routine-tabs";
import { DashboardSections, type DashSection } from "@/components/features/dashboard-sections";
import { DashboardDeadlines } from "@/components/features/dashboard-deadlines";
import type { Danger, FinanceEntry, FinancialGoal, Memento, MonthlyReport as MonthlyReportRow, Objective, Project, Quest, Routine } from "@/types";

// The month-review prompt shows during the first days of a new month, until the
// previous month's bilan is written.
const REVIEW_WINDOW_DAYS = 10;

// Small styled link that mirrors the prototype's "Gérer →" button.
function ManageLink({ href, children = "Gérer →" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="small-btn"
      style={{ borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
    >
      {children}
    </Link>
  );
}

function Empty({ icon, text, href }: { icon: string; text: string; href: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      {text} <Link href={href} style={{ color: "var(--cyan-soft)" }}>Ajouter →</Link>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const uid = user!.id;
  const thisMonth = todayISO().slice(0, 7);

  // Parallel reads — all owner-scoped + protected by RLS.
  const [mementos, routines, monthly, yearly, quests, projects, finance, finGoals, dangers, profile, reports] =
    await Promise.all([
      supabase.from("mementos").select("*").eq("user_id", uid),
      supabase.from("routines").select("*").eq("user_id", uid),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "monthly"),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "yearly"),
      supabase.from("quests").select("*").eq("user_id", uid),
      supabase.from("projects").select("*").eq("user_id", uid),
      supabase.from("finance_entries").select("*").eq("user_id", uid),
      supabase.from("financial_goals").select("*").eq("user_id", uid),
      supabase.from("dangers").select("*").eq("user_id", uid),
      supabase.from("profiles").select("dashboard_order").eq("id", uid).maybeSingle(),
      supabase.from("monthly_reports").select("*").eq("user_id", uid).order("month", { ascending: false }),
    ]);

  const mementoRows = (mementos.data ?? []) as Memento[];
  const routineRows = (routines.data ?? []) as Routine[];
  const monthlyRows = (monthly.data ?? []) as Objective[];
  const yearlyRows = (yearly.data ?? []) as Objective[];
  const questRows = (quests.data ?? []) as Quest[];
  const projectRows = (projects.data ?? []) as Project[];
  const financeRows = (finance.data ?? []) as FinanceEntry[];
  const finGoalRows = (finGoals.data ?? []) as FinancialGoal[];
  const dangerRows = (dangers.data ?? []) as Danger[];
  const dashboardOrder = (profile.data?.dashboard_order ?? []) as string[];

  // ----- Monthly report prompt (banner only; the report lives on /bilan) -----
  const reportRows = (reports.data ?? []) as MonthlyReportRow[];
  const reviewMonth = prevMonthKey(thisMonth); // the month that just ended
  const reviewDone = reportRows.some((r) => r.month === reviewMonth && r.review_notes.trim() !== "");
  const dayOfMonth = Number(todayISO().slice(8, 10));
  const showReviewBanner = dayOfMonth <= REVIEW_WINDOW_DAYS && !reviewDone;

  // ----- Routine (daily) -----
  const dailyRoutines = routineRows.filter((r) => (r.frequency ?? "daily") === "daily");
  const weeklyRoutines = routineRows.filter((r) => r.frequency === "weekly");
  const monthlyRoutines = routineRows.filter((r) => r.frequency === "monthly");
  const otherRoutines = [...weeklyRoutines, ...monthlyRoutines];
  const routineDone = dailyRoutines.filter((r) => r.done).length;
  const routineTotal = dailyRoutines.length;
  const routinePct = percentage(routineDone, routineTotal);

  // ----- Quests -----
  const questsDone = questRows.filter((q) => q.done).length;
  const questsPct = percentage(questsDone, questRows.length);

  // ----- Finance (current month) — recurring entries count every month -----
  const oneOff = financeRows.filter((e) => !e.recurring);
  const rec = financeRows.filter((e) => e.recurring);
  const monthOneOff = oneOff.filter((e) => e.entry_date.slice(0, 7) === thisMonth);
  const monthExpenses = monthOneOff.filter((e) => e.type === "expense");
  const recurringIncome = rec.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const income = monthOneOff.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0) + recurringIncome;
  const recurringSpent = rec.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
  const spent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0) + recurringSpent;
  const net = income - spent;

  // ----- Financial obligations + goals (split by kind) -----
  const obligations = finGoalRows.filter((g) => g.kind === "obligation");
  const goals = finGoalRows.filter((g) => (g.kind ?? "goal") === "goal");
  // Budget simulation: how much to set aside each month to hit every dated
  // *goal* (not obligation) on time, and what's left of the monthly result after.
  const goalsMonthlyNeed = goals.reduce(
    (s, g) => s + monthlySavingNeeded(Math.max(0, Number(g.target) - Number(g.saved)), g.deadline),
    0,
  );
  const netAfterGoals = net - goalsMonthlyNeed;

  // ----- Memento deadlines (échéances), soonest first -----
  const deadlineMementos = mementoRows
    .filter((m) => m.expires_at)
    .sort((a, b) => (a.expires_at ?? "").localeCompare(b.expires_at ?? ""))
    .map((m) => ({ id: m.id, name: m.name, expires_at: m.expires_at! }));

  // ----- Reorderable dashboard blocks (order synced to the profile) -----
  const sections: DashSection[] = [
    {
      key: "memento",
      label: "📝 Memento",
      node: (
        <div className="card memento-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">📝 Memento</h3>
              <p className="card-sub">Rappels importants, motivation, factures ou choses à ne pas oublier.</p>
            </div>
            <ManageLink href="/memento" />
          </div>
          {mementoRows.length ? (
            <>
              {/* Échéances — mises en avant avec un compte à rebours vivant */}
              {deadlineMementos.length > 0 && <DashboardDeadlines items={deadlineMementos} />}
              {/* Principes / citations — le texte inspirant */}
              {mementoRows
                .filter((m) => !m.expires_at)
                .map((m) => (
                  <div className="memento-item" key={m.id}>
                    <div className="memento-quote">{m.name}</div>
                  </div>
                ))}
            </>
          ) : (
            <Empty icon="📝" text="Aucun memento." href="/memento" />
          )}
        </div>
      ),
    },
    {
      key: "financial-obligations",
      label: "📌 Obligations financières",
      node: (
        <FinancialCard
          icon="📌"
          title="Obligations financières"
          sub="Ce que tu dois payer — prêt, soutien familial…"
          items={obligations}
          emptyIcon="📌"
          emptyText="Aucune obligation financière."
        />
      ),
    },
    {
      key: "financial-goals",
      label: "🎯 Objectifs financiers",
      node: (
        <FinancialCard
          icon="🎯"
          title="Objectifs financiers"
          sub="Ta progression d’épargne."
          items={goals}
          emptyIcon="🎯"
          emptyText="Aucun objectif financier."
        />
      ),
    },
    {
      key: "daily-quests",
      label: "🗓️ Quêtes quotidiennes",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🗓️ Quêtes quotidiennes</h3>
              <p className="card-sub">
                Progression : <strong>{routinePct}%</strong> · {routineDone}/{routineTotal} faites
              </p>
            </div>
            <ManageLink href="/routine" />
          </div>
          <div className="big-bar"><div className="big-bar-fill" style={{ width: `${routinePct}%` }} /></div>
          <div style={{ marginTop: 12 }}>
            {dailyRoutines.length ? (
              <DashboardCheckList resource="routines" items={dailyRoutines} />
            ) : (
              <Empty icon="🗓️" text="Aucune quête quotidienne." href="/routine" />
            )}
          </div>
        </div>
      ),
    },
    ...(otherRoutines.length > 0
      ? [{
          key: "other-routines",
          label: "📅 Quêtes hebdo & mensuelles",
          node: (
            <div className="card">
              <div className="card-head">
                <div>
                  <h3 className="card-title">📅 Quêtes hebdo &amp; mensuelles</h3>
                  <p className="card-sub">{otherRoutines.filter((r) => r.done).length}/{otherRoutines.length} faites</p>
                </div>
                <ManageLink href="/routine" />
              </div>
              <div style={{ marginTop: 12 }}>
                <DashboardRoutineTabs weekly={weeklyRoutines} monthly={monthlyRoutines} />
              </div>
            </div>
          ),
        } as DashSection]
      : []),
    {
      key: "monthly-objectives",
      label: "🎯 Objectifs du mois",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🎯 Objectifs du mois</h3>
              <p className="card-sub">Objectif + actions à réaliser</p>
            </div>
            <ManageLink href="/objectives" />
          </div>
          {monthlyRows.length ? (
            monthlyRows.map((o) => <ObjectiveRow key={o.id} item={o} />)
          ) : (
            <Empty icon="🎯" text="Aucun objectif du mois." href="/objectives" />
          )}
        </div>
      ),
    },
    {
      key: "yearly-objectives",
      label: "🗓️ Objectifs de l’année",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🗓️ Objectifs de l’année</h3>
              <p className="card-sub">Objectif + plan d’action annuel</p>
            </div>
            <ManageLink href="/objectives" />
          </div>
          {yearlyRows.length ? (
            yearlyRows.map((o) => <ObjectiveRow key={o.id} item={o} />)
          ) : (
            <Empty icon="🗓️" text="Aucun objectif de l’année." href="/objectives" />
          )}
        </div>
      ),
    },
    {
      key: "special-quests",
      label: "⚔️ Quêtes spéciales",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">⚔️ Quêtes spéciales</h3>
              <p className="card-sub">Progression : <strong>{questsPct}%</strong></p>
            </div>
            <ManageLink href="/quests" />
          </div>
          <div className="big-bar"><div className="big-bar-fill" style={{ width: `${questsPct}%` }} /></div>
          <div style={{ marginTop: 12 }}>
            {questRows.length ? (
              <DashboardCheckList resource="quests" items={questRows} />
            ) : (
              <Empty icon="⚔️" text="Aucune quête spéciale." href="/quests" />
            )}
          </div>
        </div>
      ),
    },
    {
      key: "projects",
      label: "🚀 Projets en cours",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🚀 Projets en cours</h3>
              <p className="card-sub">Tous tes projets actifs</p>
            </div>
            <ManageLink href="/projects" />
          </div>
          {projectRows.length ? (
            projectRows.map((p) => <ObjectiveRow key={p.id} item={{ name: p.name, progress: p.progress }} />)
          ) : (
            <Empty icon="🚀" text="Aucun projet en cours." href="/projects" />
          )}
        </div>
      ),
    },
    {
      key: "budget",
      label: "💰 Budget du mois",
      node: (
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">💰 Budget du mois</h3>
              <p className="card-sub">
                Dépenses : <strong>{money(spent)}</strong> (dont {money(recurringSpent)} récurrentes) · Argent gagné : <strong>{money(income)}</strong> · Résultat :{" "}
                <strong className={net >= 0 ? "money-positive" : "money-negative"}>{money(net)}</strong>
              </p>
            </div>
            <ManageLink href="/finance" />
          </div>
          <div className="budget-results">
            {/* Résultat 1 — dépenses seules */}
            <div className={`budget-result ${net >= 0 ? "is-pos" : "is-neg"}`}>
              <div className="card-sub">Résultat du mois · revenus − dépenses</div>
              <div className={net >= 0 ? "money-positive" : "money-negative"} style={{ fontSize: 32, fontWeight: 800, margin: "2px 0" }}>
                {money(net)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                <span className="card-sub">Revenus <strong className="money-positive">{money(income)}</strong></span>
                <span className="card-sub">Dépenses <strong className="money-negative">{money(spent)}</strong></span>
              </div>
            </div>

            {/* Résultat 2 — après l'épargne nécessaire pour les objectifs datés */}
            {goalsMonthlyNeed > 0 && (
              <div className={`budget-result ${netAfterGoals >= 0 ? "is-pos" : "is-neg"}`}>
                <div className="card-sub">Après épargne objectifs · − {money(goalsMonthlyNeed)}/mois</div>
                <div className={netAfterGoals >= 0 ? "money-positive" : "money-negative"} style={{ fontSize: 32, fontWeight: 800, margin: "2px 0" }}>
                  {money(netAfterGoals)}
                </div>
                <div className="card-sub">
                  {netAfterGoals >= 0
                    ? "Il te reste ça après avoir mis de côté pour tes échéances. 🎯"
                    : "Ton budget ne couvre pas encore l’épargne nécessaire. ⚠️"}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "dangers",
      label: "🧨 Dangers à éviter",
      node: (
        <div className="card danger-card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🧨 Dangers à éviter</h3>
              <p className="card-sub">Actions qui créent de la friction, te tirent vers le bas ou cassent ton flow.</p>
            </div>
            <ManageLink href="/dangers" />
          </div>
          {dangerRows.length ? (
            <div className="danger-list">
              {dangerRows.map((d) => (
                <div className="danger-row" key={d.id}>
                  <span className="danger-name">{d.name}</span>
                  {d.category ? <span className="danger-tag">{d.category}</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <Empty icon="🧨" text="Aucun danger listé." href="/dangers" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page section active">
      <PageHead title="Tableau de bord" sub="Vue d’ensemble de ta progression personnelle." />

      {showReviewBanner && (
        <Link href="/bilan" className="review-banner" aria-label={`Faire le bilan de ${monthLabel(reviewMonth)}`}>
          <span className="review-banner-icon">📅</span>
          <span className="review-banner-text">
            <strong>Nouveau mois — fais le bilan de {monthLabel(reviewMonth)}.</strong>
            <span className="review-banner-sub">Objectifs atteints ? Note ton throwback et définis tes objectifs du mois.</span>
          </span>
          <span className="review-banner-cta">Ouvrir →</span>
        </Link>
      )}

      <DashboardSections sections={sections} savedOrder={dashboardOrder} />
    </div>
  );
}

// A financial section (obligations or goals) with per-item deadline + the
// monthly saving needed to reach each dated item on time.
function FinancialCard({
  icon,
  title,
  sub,
  items,
  emptyIcon,
  emptyText,
}: {
  icon: string;
  title: string;
  sub: string;
  items: FinancialGoal[];
  emptyIcon: string;
  emptyText: string;
}) {
  const totalTarget = items.reduce((s, g) => s + Number(g.target), 0);
  const totalSaved = items.reduce((s, g) => s + Number(g.saved), 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h3 className="card-title">{icon} {title}</h3>
          <p className="card-sub">{sub}</p>
        </div>
        <ManageLink href="/finance" />
      </div>
      {items.length ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span className="money-neutral" style={{ fontSize: 28, fontWeight: 800 }}>Restant : {money(totalRemaining)}</span>
            <span className="card-sub" style={{ fontSize: 14 }}>{money(totalSaved)} / {money(totalTarget)}</span>
          </div>
          <div className="grid grid-2">
            {items.map((g) => {
              const pct = percentage(Number(g.saved), Number(g.target));
              const remaining = Math.max(0, Number(g.target) - Number(g.saved));
              const need = monthlySavingNeeded(remaining, g.deadline);
              return (
                <div className="objective" key={g.id}>
                  {g.image ? <img src={g.image} alt={g.name} className="goal-image-sm" /> : null}
                  <div className="objective-head">
                    <span className="objective-name">{g.name}</span>
                    <span className="card-sub">{money(g.saved)} / {money(g.target)}</span>
                  </div>
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="big-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="objective-percent">{pct}%</span>
                  </div>
                  {g.deadline && (
                    <div className="fin-deadline">
                      🗓️ {formatDayLabel(g.deadline)}
                      {need > 0 ? <> · <strong>{money(need)}/mois</strong> pour y arriver</> : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <Empty icon={emptyIcon} text={emptyText} href="/finance" />
      )}
    </div>
  );
}

// Objective / project progress row (read-only summary on the dashboard).
function ObjectiveRow({ item }: { item: { name: string; progress: number; actions?: string } }) {
  return (
    <div className="objective" style={{ marginBottom: 10 }}>
      <div className="objective-head">
        <span className="objective-name">{item.name}</span>
      </div>
      {item.actions ? <div className="objective-actions">{item.actions}</div> : null}
      <div className="objective-progress-line">
        <div className="big-bar"><div className="big-bar-fill" style={{ width: `${item.progress}%` }} /></div>
        <span className="objective-percent">{item.progress}%</span>
      </div>
    </div>
  );
}
