import {
  rollup,
  healthColor,
  toInr,
  summarizeInInr,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  type Client,
  type Subproject,
} from "@/lib/hq";
import { getInrRates } from "@/lib/fx";
import {
  getClientsAll,
  getSubprojectsAll,
  getPettyCashAll,
  getExpensesAll,
} from "@/lib/hq-data";
import { TimeSeriesChart, type ChartRow, type SeriesDef, type DotPoint } from "./hq-charts";

export const dynamic = "force-dynamic";

// 'YYYY-MM' bucket for a date/timestamp string (leading YYYY-MM wins so
// timezone offsets on day-1 dates can't shove the value into a neighbour month).
function monthKey(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})/.exec(dateStr);
  if (m) return `${m[1]}-${m[2]}`;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const [clientsAll, subList, pettyAll, expensesAll, rates] = await Promise.all([
    getClientsAll(),
    getSubprojectsAll(),
    getPettyCashAll(),
    getExpensesAll(),
    getInrRates(),
  ]);

  const clientList: Client[] = clientsAll.filter((c) => !c.archived);
  const pettyList = pettyAll as unknown as {
    amount: number;
    currency: string;
    spent_on: string | null;
  }[];
  const expenseList = expensesAll as unknown as {
    amount: number;
    currency: string;
    incurred_on: string | null;
  }[];

  const subsByClient = new Map<string, Subproject[]>();
  for (const s of subList) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const inr = summarizeInInr(clientList, subsByClient, pettyList, expenseList, rates);
  const expensesTotal = inr.pettyCash + inr.expenses;
  const subprojectCount = subList.length;

  // Monthly timelines: buckets run from March 2026 through the current month.
  // No dated revenue is stored, so each client's totals are booked to its
  // "anchor" month: kickoff date → else its earliest sub-project → else the
  // client's created_at. Expenses/petty use their own dates. Out-of-window
  // dates clamp into the first bucket so nothing is dropped.
  const now = new Date();
  const START_YEAR = 2026;
  const START_MONTH = 2; // 0-indexed → March
  const monthCount = Math.max(
    1,
    (now.getFullYear() - START_YEAR) * 12 + (now.getMonth() - START_MONTH) + 1
  );

  type Bucket = { x: number; label: string; revenue: number; expenses: number; clientCost: number };
  const buckets: Bucket[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(START_YEAR, START_MONTH + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    indexByKey.set(key, i);
    buckets.push({
      x: i,
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      revenue: 0,
      expenses: 0,
      clientCost: 0,
    });
  }

  const idxOf = (key: string | null): number | null => {
    if (key == null) return null;
    const direct = indexByKey.get(key);
    return direct !== undefined ? direct : 0;
  };

  // Earliest sub-project created_at per client (anchor fallback).
  const earliestSub = new Map<string, string>();
  for (const s of subList) {
    if (!s.created_at) continue;
    const prev = earliestSub.get(s.client_id);
    if (!prev || s.created_at < prev) earliestSub.set(s.client_id, s.created_at);
  }

  // Cost stays anchored: each client's cost is booked to its anchor month
  // (kickoff → earliest sub-project → created_at). One cost dot per client.
  const costDots: DotPoint[] = [];
  for (const c of clientList) {
    const anchor = c.kickoff_date ?? earliestSub.get(c.id) ?? c.created_at;
    const idx = idxOf(monthKey(anchor));
    if (idx === null) continue;
    const clientCostInr = toInr(Number(c.cost || 0), c.currency, rates);
    buckets[idx].clientCost += clientCostInr;
    costDots.push({ x: idx, value: clientCostInr, name: c.name });
  }

  // Revenue is driven by phase payment dates: every phase amount lands in the
  // bucket for its own month. One revenue dot per (client, month-with-phases) —
  // value is the client's total phase amount that month, breakdown the per-phase
  // split (labelled "<sub> : <phase>"). Unparseable/empty dates are skipped;
  // out-of-window dates clamp into bucket 0.
  const revenueDots: DotPoint[] = [];
  for (const c of clientList) {
    const subs = subsByClient.get(c.id) ?? [];
    const byMonth = new Map<number, { total: number; phases: Map<string, number> }>();
    for (const s of subs) {
      for (const ph of s.phases ?? []) {
        const key = monthKey(ph.date);
        if (key == null) continue;
        const idx = idxOf(key);
        if (idx === null) continue;
        const amountInr = toInr(Math.max(0, Number(ph.amount || 0)), c.currency, rates);
        buckets[idx].revenue += amountInr;
        let entry = byMonth.get(idx);
        if (!entry) {
          entry = { total: 0, phases: new Map() };
          byMonth.set(idx, entry);
        }
        entry.total += amountInr;
        const label = `${s.name}: ${ph.name}`;
        entry.phases.set(label, (entry.phases.get(label) ?? 0) + amountInr);
      }
    }
    for (const [idx, entry] of Array.from(byMonth.entries())) {
      revenueDots.push({
        x: idx,
        value: entry.total,
        name: c.name,
        breakdown: Array.from(entry.phases.entries()).map(([label, value]) => ({ label, value })),
      });
    }
  }

  // Expenses line = company expenses (incurred_on) + petty cash (spent_on).
  for (const e of expenseList) {
    const idx = idxOf(monthKey(e.incurred_on));
    if (idx !== null) buckets[idx].expenses += toInr(Number(e.amount || 0), e.currency, rates);
  }
  for (const p of pettyList) {
    const idx = idxOf(monthKey(p.spent_on));
    if (idx !== null) buckets[idx].expenses += toInr(Number(p.amount || 0), p.currency, rates);
  }

  const chartRows: ChartRow[] = buckets.map((b) => ({
    x: b.x,
    label: b.label,
    revenue: b.revenue,
    expenses: b.expenses,
    clientCost: b.clientCost,
  }));

  const REVENUE_SERIES: SeriesDef[] = [
    { key: "revenue", name: "revenue", color: "#E8533A", area: true },
  ];
  const COST_SERIES: SeriesDef[] = [
    { key: "expenses", name: "expenses", color: "#6366f1", area: true },
    { key: "clientCost", name: "client costs", color: "#f59e0b", area: true },
  ];

  // Health board — worst first (red < amber < green < grey).
  const order = { red: 0, amber: 1, green: 2, grey: 3 } as const;
  const board = clientList
    .map((c) => {
      const r = rollup(subsByClient.get(c.id) ?? [], c.kickoff_date);
      return { client: c, roll: r, health: healthColor(r.progress, r.count, r.offTrack) };
    })
    .sort((a, b) => order[a.health] - order[b.health] || b.roll.outstanding - a.roll.outstanding);
  const offTrack = board.filter((b) => b.health === "red").length;

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <div className="flex items-center gap-6 flex-wrap mb-2 font-mono text-xs text-muted">
        <span>{clientList.length} active clients</span>
        <span>· {subprojectCount} sub-projects</span>
        <span>· <span className={offTrack ? "text-red-600" : "text-dark"}>{offTrack} off track</span></span>
      </div>
      <p className="font-mono text-[10px] text-muted/70 mb-6">
        {"// all figures converted to INR at current rates (per-currency breakdown lives on Finance)"}
      </p>

      {/* INR KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <Kpi label="Contract" value={formatMoney(inr.contract, "INR")} />
        <Kpi label="Collected" value={formatMoney(inr.collected, "INR")} />
        <Kpi label="Outstanding" value={formatMoney(inr.outstanding, "INR")} accent />
        <Kpi label="Project cost" value={formatMoney(inr.cost, "INR")} />
        <Kpi label="Expenses" value={formatMoney(expensesTotal, "INR")} />
        <Kpi label="Net (cash)" value={formatMoney(inr.net, "INR")} tone={inr.net >= 0 ? "pos" : "neg"} />
      </div>

      {/* Revenue timeline — one dot per client, hover shows its sub-projects */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-6">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// revenue over time (INR)"}</p>
        <TimeSeriesChart
          data={chartRows}
          series={REVENUE_SERIES}
          dots={revenueDots}
          dotName="clients"
          dotColor="#E8533A"
        />
      </div>

      {/* Cost timeline — expenses line + client-costs line, one dot per client */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-10">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// cost over time (INR)"}</p>
        <TimeSeriesChart
          data={chartRows}
          series={COST_SERIES}
          dots={costDots}
          dotName="clients"
          dotColor="#f59e0b"
        />
      </div>

      {/* Health board */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// client health"}</p>
      <ul className="flex flex-col gap-2">
        {board.map(({ client, roll, health }) => (
          <li key={client.id} className="border border-dark/10 rounded-xl bg-white px-5 py-3 flex items-center gap-4 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${HEALTH_DOT[health]}`} title={HEALTH_LABEL[health]} />
            <a href={`/admin/hq/clients/${client.id}`} className="font-serif text-base text-dark min-w-[140px] hover:text-coral">
              {client.name}
            </a>
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest">{HEALTH_LABEL[health]}</span>
            <span className="font-mono text-xs text-dark">{roll.progress}%</span>
            <span className="font-sans text-sm text-coral ml-auto">
              {formatMoney(roll.outstanding, client.currency)} <span className="text-muted">outstanding</span>
            </span>
          </li>
        ))}
        {board.length === 0 && <p className="font-sans text-muted">No active clients — add one under Clients.</p>}
      </ul>
    </section>
  );
}

function Kpi({
  label,
  value,
  accent,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "pos" | "neg";
}) {
  const color = tone === "pos" ? "text-emerald-700" : tone === "neg" ? "text-red-600" : accent ? "text-coral" : "text-dark";
  return (
    <div className="border border-dark/10 rounded-xl bg-white p-4">
      <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-sans text-base ${color}`}>{value}</p>
    </div>
  );
}
