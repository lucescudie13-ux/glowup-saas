import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui/page-head";
import { clamp, money, percentage, todayISO } from "@/lib/utils";
import { DashboardCheckList } from "@/components/features/dashboard-check-list";
import type { Danger, FinanceEntry, FinancialGoal, Memento, Objective, Project, Quest, Routine, Task } from "@/types";

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
  const [mementos, routines, tasks, monthly, yearly, quests, projects, finance, finGoals, dangers] =
    await Promise.all([
      supabase.from("mementos").select("*").eq("user_id", uid),
      supabase.from("routines").select("*").eq("user_id", uid),
      supabase.from("tasks").select("*").eq("user_id", uid),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "monthly"),
      supabase.from("objectives").select("*").eq("user_id", uid).eq("period", "yearly"),
      supabase.from("quests").select("*").eq("user_id", uid),
      supabase.from("projects").select("*").eq("user_id", uid),
      supabase.from("finance_entries").select("*").eq("user_id", uid),
      supabase.from("financial_goals").select("*").eq("user_id", uid),
      supabase.from("dangers").select("*").eq("user_id", uid),
    ]);

  const mementoRows = (mementos.data ?? []) as Memento[];
  const routineRows = (routines.data ?? []) as Routine[];
  const taskRows = ((tasks.data ?? []) as Task[]).filter((t) => (t.scope ?? "today") === "today");
  const monthlyRows = (monthly.data ?? []) as Objective[];
  const yearlyRows = (yearly.data ?? []) as Objective[];
  const questRows = (quests.data ?? []) as Quest[];
  const projectRows = (projects.data ?? []) as Project[];
  const financeRows = (finance.data ?? []) as FinanceEntry[];
  const finGoalRows = (finGoals.data ?? []) as FinancialGoal[];
  const dangerRows = (dangers.data ?? []) as Danger[];

  // ----- Routine + tasks (daily) -----
  const routineTotalMin = routineRows.reduce((s, r) => s + (r.minutes || 1), 0);
  const routineDoneMin = routineRows.filter((r) => r.done).reduce((s, r) => s + (r.minutes || 1), 0);
  const routinePct = percentage(routineDoneMin, routineTotalMin);

  const taskDoneMin = taskRows.filter((t) => t.done).reduce((s, t) => s + Number(t.minutes || 0), 0);
  const taskTotalMin = taskRows.reduce((s, t) => s + Number(t.minutes || 0), 0);
  const dayDoneMin = taskDoneMin + routineDoneMin;
  const dayTotalMin = taskTotalMin + routineTotalMin;

  // ----- Quests -----
  const questsDone = questRows.filter((q) => q.done).length;
  const questsPct = percentage(questsDone, questRows.length);

  // ----- Finance (current month) — recurring expenses count every month -----
  const oneOff = financeRows.filter((e) => !e.recurring);
  const recurringExpenses = financeRows.filter((e) => e.recurring);
  const monthOneOff = oneOff.filter((e) => e.entry_date.slice(0, 7) === thisMonth);
  const monthExpenses = monthOneOff.filter((e) => e.type === "expense");
  const income = monthOneOff.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0);
  const recurringSpent = recurringExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const spent = monthExpenses.reduce((s, e) => s + Number(e.amount), 0) + recurringSpent;
  const net = income - spent;

  // ----- Financial goals (remaining to save) -----
  const finGoalsTarget = finGoalRows.reduce((s, g) => s + Number(g.target), 0);
  const finGoalsSaved = finGoalRows.reduce((s, g) => s + Number(g.saved), 0);
  const finGoalsRemaining = Math.max(0, finGoalsTarget - finGoalsSaved);

  return (
    <div className="page section active">
      <PageHead title="Tableau de bord" sub="Vue d’ensemble de ta progression personnelle." />

      {/* ===== Memento ===== */}
      <div className="card memento-card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">📝 Memento</h3>
            <p className="card-sub">Rappels importants, motivation, factures ou choses à ne pas oublier.</p>
          </div>
          <ManageLink href="/memento" />
        </div>
        {mementoRows.length ? (
          mementoRows.map((m) => (
            <div className="memento-item" key={m.id}>
              <div className="memento-quote">{m.name}</div>
            </div>
          ))
        ) : (
          <Empty icon="📝" text="Aucun memento." href="/memento" />
        )}
      </div>

      {/* ===== Objectifs financiers ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">🎯 Objectifs financiers</h3>
            <p className="card-sub">Ta progression d’épargne.</p>
          </div>
          <ManageLink href="/financial-goals" />
        </div>
        {finGoalRows.length ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <span className="money-neutral" style={{ fontSize: 28, fontWeight: 800 }}>{money(finGoalsRemaining)}</span>
              <span className="card-sub" style={{ fontSize: 14 }}>restants à épargner · {money(finGoalsSaved)} / {money(finGoalsTarget)}</span>
            </div>
          </>
        ) : null}
        {finGoalRows.length ? (
          <div className="grid grid-2">
            {finGoalRows.map((g) => {
              const pct = percentage(Number(g.saved), Number(g.target));
              return (
                <div className="objective" key={g.id}>
                  <div className="objective-head">
                    <span className="objective-name">{g.name}</span>
                    <span className="card-sub">{money(g.saved)} / {money(g.target)}</span>
                  </div>
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="big-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <span className="objective-percent">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon="🎯" text="Aucun objectif financier." href="/financial-goals" />
        )}
      </div>

      {/* ===== Routine + Tâches ===== */}
      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">🔁 Routine</h3>
              <p className="card-sub">
                Progression : <strong>{routinePct}%</strong> · {routineDoneMin} min / {routineTotalMin} min
              </p>
            </div>
            <ManageLink href="/routine" />
          </div>
          <div className="big-bar"><div className="big-bar-fill" style={{ width: `${routinePct}%` }} /></div>
          <div style={{ marginTop: 12 }}>
            {routineRows.length ? (
              <DashboardCheckList resource="routines" items={routineRows} withMinutes />
            ) : (
              <Empty icon="🔁" text="Aucune routine." href="/routine" />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">⏱️ Tâches du jour</h3>
              <p className="card-sub">{dayDoneMin} min / {dayTotalMin} min</p>
            </div>
            <ManageLink href="/tasks" />
          </div>
          <div className="big-bar"><div className="big-bar-fill" style={{ width: `${percentage(dayDoneMin, dayTotalMin)}%` }} /></div>
          <div style={{ marginTop: 12 }}>
            {taskRows.length ? (
              <DashboardCheckList resource="tasks" items={taskRows} withMinutes />
            ) : (
              <Empty icon="⏱️" text="Aucune tâche." href="/tasks" />
            )}
          </div>
        </div>
      </div>

      {/* ===== Objectifs du mois ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
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

      {/* ===== Objectifs de l'année ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
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

      {/* ===== Quêtes spéciales ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
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

      {/* ===== Projets en cours ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
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


      {/* ===== Budget du mois ===== */}
      <div className="card" style={{ marginBottom: 16 }}>
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
        <h3 className="card-title" style={{ marginBottom: 12 }}>Dernières dépenses</h3>
        {monthExpenses.length ? (
          <>
            {monthExpenses.slice(0, 6).map((e) => (
              <div className="row" key={e.id}>
                <div className="row-left">
                  <span className="row-name">{e.name}</span>
                  <span className="cat-tag">{e.category || "Autre"}</span>
                </div>
                <strong className="money-negative">{money(e.amount)}</strong>
              </div>
            ))}
            {monthExpenses.length > 6 ? (
              <p className="card-sub" style={{ marginTop: 8 }}>+ {monthExpenses.length - 6} autres dépenses dans la rubrique Budget.</p>
            ) : null}
          </>
        ) : (
          <Empty icon="💰" text="Aucune dépense ponctuelle ce mois-ci." href="/finance" />
        )}
      </div>

      {/* ===== Dangers ===== */}
      <div className="card danger-card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <div>
            <h3 className="card-title">🧨 Dangers à éviter</h3>
            <p className="card-sub">Actions qui créent de la friction, te tirent vers le bas ou cassent ton flow.</p>
          </div>
          <ManageLink href="/dangers" />
        </div>
        {dangerRows.length ? (
          <div className="grid grid-2">
            {dangerRows.map((d) => {
              const impact = Number(d.impact || 1);
              return (
                <div className="danger-item" key={d.id}>
                  <div className="objective-head">
                    <span className="danger-title">{d.name}</span>
                    <span className="danger-tag">{d.category || "Autre"}</span>
                  </div>
                  <div className="objective-progress-line">
                    <div className="big-bar"><div className="danger-bar-fill" style={{ width: `${clamp(impact * 20)}%` }} /></div>
                    <span className="objective-percent" style={{ color: "var(--danger-soft)" }}>{impact}/5</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon="🧨" text="Aucun danger listé." href="/dangers" />
        )}
      </div>
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
