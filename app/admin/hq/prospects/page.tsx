import { formatMoney } from "@/lib/hq";
import { getProspectsAll } from "@/lib/hq-data";
import { canView, canManage } from "@/lib/hq-perms";
import { requireUser } from "../guard";
import { STAGES, STAGE_LABELS, salesMetrics, type Prospect, type Stage } from "./stages";
import KanbanBoard from "./kanban-board";
import ProspectList from "./prospect-list";
import NewProspectDrawer from "./new-prospect-drawer";
import FollowupTicker from "./followup-ticker";

export const dynamic = "force-dynamic";

const pillCls = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
    active ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
  }`;

type StageSummary = { stage: Stage; count: number; value: number; currency: string };

// Per-stage count + summed est_value. The pipeline can mix currencies, so the
// total is shown in that stage's dominant (most common) currency.
function summarize(prospects: Prospect[]): StageSummary[] {
  return STAGES.map((stage) => {
    const rows = prospects.filter((p) => p.stage === stage);
    const byCurrency = new Map<string, number>();
    let value = 0;
    for (const p of rows) {
      value += Number(p.est_value || 0);
      byCurrency.set(p.currency, (byCurrency.get(p.currency) || 0) + 1);
    }
    let currency = "INR";
    let top = 0;
    for (const [cur, n] of Array.from(byCurrency.entries())) {
      if (n > top) {
        top = n;
        currency = cur;
      }
    }
    return { stage, count: rows.length, value, currency };
  });
}

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const gate = await requireUser();
  if (!gate.ok) return null;
  const perms = gate.perms;
  if (!canView(perms, "prospects")) {
    return (
      <section className="px-6 md:px-12 pb-24 max-w-[900px] mx-auto pt-6">
        <p className="font-mono text-xs text-coral uppercase tracking-widest">
          {"// 403 — no access to Prospects"}
        </p>
      </section>
    );
  }
  const canManageProspects = canManage(perms, "prospects");

  const view = searchParams.view === "list" ? "list" : "kanban";
  const prospects = (await getProspectsAll()) as unknown as Prospect[];
  const summaries = summarize(prospects);
  const metrics = salesMetrics(prospects);

  // Active timers the in-app ticker watches (won/lost drop out of reminders).
  const dueTimes = prospects
    .filter((p) => p.stage !== "won" && p.stage !== "lost" && p.next_followup_at)
    .map((p) => p.next_followup_at as string);

  const stat = (label: string, value: string, sub?: string, accent?: boolean) => (
    <div
      key={label}
      className={`border rounded-2xl px-3 py-3 ${
        accent ? "border-coral/40 bg-coral/[0.04]" : "border-dark/10 bg-white"
      }`}
    >
      <p className="font-mono text-[10px] text-muted uppercase tracking-widest">{label}</p>
      <p className={`font-serif text-xl leading-tight mt-1 ${accent ? "text-coral" : "text-dark"}`}>
        {value}
      </p>
      {sub && <p className="font-sans text-xs text-muted mt-0.5">{sub}</p>}
    </div>
  );

  // The kanban owns its own "+ New prospect" (so a create can paint an optimistic
  // card into the board's state). Keep the header trigger for the list view, and
  // for the empty state where the board isn't rendered yet. Managers only.
  const showHeaderNew =
    canManageProspects && (view === "list" || prospects.length === 0);

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <a href="/admin/hq/prospects?view=kanban" className={pillCls(view === "kanban")}>
            kanban
          </a>
          <a href="/admin/hq/prospects?view=list" className={pillCls(view === "list")}>
            list
          </a>
        </div>
        {showHeaderNew && <NewProspectDrawer />}
      </div>

      {canManageProspects && <FollowupTicker dueTimes={dueTimes} />}

      {prospects.length > 0 && (
        <>
          <p className="section-label mb-2">// outreach</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
            {stat("Reply rate", `${metrics.replyRate}%`, `${metrics.responded}/${metrics.reachedOut} replied`, true)}
            {stat("Close rate", `${metrics.closeRate}%`, `${metrics.won} won`)}
            {stat("Reached out", String(metrics.reachedOut))}
            {stat("Avg / day", String(metrics.avgPerDay))}
            {stat("This week", String(metrics.reachedThisWeek))}
            {stat(
              "Follow-ups due",
              String(metrics.followupsDue),
              undefined,
              metrics.followupsDue > 0
            )}
          </div>
          <p className="section-label mb-2">// pipeline</p>
        </>
      )}

      {prospects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
          {summaries.map((s) => (
            <div
              key={s.stage}
              className="border border-dark/10 rounded-2xl bg-white px-3 py-3"
            >
              <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
                {STAGE_LABELS[s.stage]}
              </p>
              <p className="font-serif text-xl text-dark leading-tight mt-1">{s.count}</p>
              <p className="font-sans text-xs text-muted mt-0.5">
                {formatMoney(s.value, s.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
          <p className="font-serif text-2xl text-dark mb-3">No prospects yet.</p>
          <p className="font-sans text-muted">
            Use “+ New prospect” to add your first lead.
          </p>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard prospects={prospects} canManage={canManageProspects} />
      ) : (
        <ProspectList prospects={prospects} canManage={canManageProspects} />
      )}
    </section>
  );
}
