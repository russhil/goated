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
import { TimeSeriesChart, type SeriesPoint, type DotPoint } from "./hq-charts";

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

  const clientCurrency = new Map<string, string>();
  const clientName = new Map<string, string>();
  const clientKickoff = new Map<string, string | null>();
  for (const c of clientList) {
    clientCurrency.set(c.id, c.currency);
    clientName.set(c.id, c.name);
    clientKickoff.set(c.id, c.kickoff_date);
  }

  const inr = summarizeInInr(clientList, subsByClient, pettyList, expenseList, rates);
  const expensesTotal = inr.pettyCash + inr.expenses;
  const subprojectCount = subList.length;

  // Monthly timelines: buckets run from March 2026 through the current month.
  // We don't store dated revenue, so revenue is attributed to each client's
  // kickoff month (falling back to the sub-project's created_at) and cost to
  // expense/petty/kickoff dates. Out-of-window dates clamp into the first
  // bucket so nothing is dropped.
  const now = new Date();
  const START_YEAR = 2026;
  const START_MONTH = 2; // 0-indexed → March
  const monthCount = Math.max(
    1,
    (now.getFullYear() - START_YEAR) * 12 + (now.getMonth() - START_MONTH) + 1
  );

  type Bucket = { x: number; label: string; revenue: number; cost: number };
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
      cost: 0,
    });
  }

  // Map a 'YYYY-MM' key to a bucket index. A dated-but-out-of-window month
  // clamps into the first (March 2026) bucket; a missing/unparseable date is
  // dropped (null).
  const idxOf = (key: string | null): number | null => {
    if (key == null) return null;
    const direct = indexByKey.get(key);
    return direct !== undefined ? direct : 0;
  };

  // Revenue = collected_revenue booked in the client's kickoff month, else the
  // sub-project's own created_at month.
  const revenueDots: DotPoint[] = [];
  for (const s of subList) {
    const kickoff = clientKickoff.get(s.client_id) ?? null;
    const attrKey = kickoff ? monthKey(kickoff) : monthKey(s.created_at);
    const idx = idxOf(attrKey);
    if (idx === null) continue;
    const cur = clientCurrency.get(s.client_id) ?? "INR";
    const value = toInr(Number(s.collected_revenue || 0), cur, rates);
    buckets[idx].revenue += value;
    revenueDots.push({
      x: idx,
      value,
      name: `${clientName.get(s.client_id) ?? "—"} · ${s.name}`,
    });
  }

  // Cost = company expenses (incurred_on) + petty cash (spent_on) + each
  // client's fixed project cost booked at its kickoff month.
  for (const e of expenseList) {
    const idx = idxOf(monthKey(e.incurred_on));
    if (idx !== null) buckets[idx].cost += toInr(Number(e.amount || 0), e.currency, rates);
  }
  for (const p of pettyList) {
    const idx = idxOf(monthKey(p.spent_on));
    if (idx !== null) buckets[idx].cost += toInr(Number(p.amount || 0), p.currency, rates);
  }
  const costDots: DotPoint[] = [];
  for (const c of clientList) {
    const idx = idxOf(monthKey(c.kickoff_date));
    if (idx === null) continue;
    const value = toInr(Number(c.cost || 0), c.currency, rates);
    buckets[idx].cost += value;
    costDots.push({ x: idx, value, name: c.name });
  }

  const revenueSeries: SeriesPoint[] = buckets.map((b) => ({
    x: b.x,
    label: b.label,
    value: b.revenue,
  }));
  const costSeries: SeriesPoint[] = buckets.map((b) => ({
    x: b.x,
    label: b.label,
    value: b.cost,
  }));

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

      {/* Revenue timeline */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-6">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// revenue over time (INR)"}</p>
        <TimeSeriesChart
          data={revenueSeries}
          dots={revenueDots}
          color="#E8533A"
          seriesName="revenue"
          dotName="sub-projects"
        />
      </div>

      {/* Cost timeline */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-10">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// cost over time (INR)"}</p>
        <TimeSeriesChart
          data={costSeries}
          dots={costDots}
          color="#6366f1"
          seriesName="cost"
          dotName="client cost"
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
