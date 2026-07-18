import { formatMoney } from "@/lib/hq";
import { getProspectsAll } from "@/lib/hq-data";
import { STAGES, STAGE_LABELS, type Prospect, type Stage } from "./stages";
import KanbanBoard from "./kanban-board";
import ProspectList from "./prospect-list";
import NewProspectDrawer from "./new-prospect-drawer";

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
  const view = searchParams.view === "list" ? "list" : "kanban";
  const prospects = (await getProspectsAll()) as unknown as Prospect[];
  const summaries = summarize(prospects);

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
        <NewProspectDrawer />
      </div>

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
        <KanbanBoard prospects={prospects} />
      ) : (
        <ProspectList prospects={prospects} />
      )}
    </section>
  );
}
