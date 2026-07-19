import {
  rollup,
  healthColor,
  toInr,
  summarizeInInr,
  clientColor,
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
import {
  StackedChart,
  type ChartRow,
  type StackSeries,
  type StackDetail,
} from "./hq-charts";

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
    vendor: string | null;
    category: string | null;
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

  type Bucket = { x: number; label: string; expenses: number };
  const buckets: Bucket[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 0; i < monthCount; i++) {
    const d = new Date(START_YEAR, START_MONTH + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    indexByKey.set(key, i);
    buckets.push({
      x: i,
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      expenses: 0,
    });
  }

  const idxOf = (key: string | null): number | null => {
    if (key == null) return null;
    const direct = indexByKey.get(key);
    return direct !== undefined ? direct : 0;
  };

  // Revenue is per-client and driven by phase payment dates: every phase amount
  // lands in the bucket for its own month, tracked per (client, month) with the
  // per-phase line-items powering the click-through detail. Unparseable/empty
  // dates are skipped; out-of-window dates clamp into bucket 0.
  const revClients = clientList.map((c) => ({ id: c.id, name: c.name, color: clientColor(c) }));

  type PhaseItem = { label: string; date: string; amount: number };
  const revByClientMonth = new Map<string, Map<number, { total: number; phases: PhaseItem[] }>>();
  clientList.forEach((c) => {
    const perMonth = new Map<number, { total: number; phases: PhaseItem[] }>();
    for (const s of subsByClient.get(c.id) ?? []) {
      for (const ph of s.phases ?? []) {
        const idx = idxOf(monthKey(ph.date));
        if (idx === null) continue;
        const amountInr = toInr(Math.max(0, Number(ph.amount || 0)), c.currency, rates);
        let entry = perMonth.get(idx);
        if (!entry) {
          entry = { total: 0, phases: [] };
          perMonth.set(idx, entry);
        }
        entry.total += amountInr;
        entry.phases.push({ label: `${s.name}: ${ph.name}`, date: ph.date, amount: amountInr });
      }
    }
    revByClientMonth.set(c.id, perMonth);
  });

  // One row per month: numeric x/label + one INR total per client ("c_<id>").
  const revData: ChartRow[] = buckets.map((b) => {
    const row: ChartRow = { x: b.x, label: b.label };
    for (const c of clientList) {
      row[`c_${c.id}`] = revByClientMonth.get(c.id)?.get(b.x)?.total ?? 0;
    }
    return row;
  });

  // One stacked band + legend chip per client; the detail panel lists that
  // client's phase payments for the clicked month.
  const revSeries: StackSeries[] = revClients.map((c) => ({ key: `c_${c.id}`, name: c.name, color: c.color }));
  const revDetails: Record<string, StackDetail[]> = {};
  for (const c of clientList) {
    const perMonth = revByClientMonth.get(c.id);
    if (!perMonth) continue;
    perMonth.forEach((entry, monthIdx) => {
      revDetails[`c_${c.id}|${monthIdx}`] = entry.phases;
    });
  }

  // Cost timeline mirrors revenue: company expenses booked to their own month
  // (with per-vendor / petty-cash line-items) as a grey band, plus each client's
  // phase COSTS booked to each phase's own month, each rendered as its own line.
  const expenseDetailByMonth = new Map<number, StackDetail[]>();
  for (const e of expenseList) {
    const idx = idxOf(monthKey(e.incurred_on));
    if (idx === null) continue;
    const amountInr = toInr(Number(e.amount || 0), e.currency, rates);
    buckets[idx].expenses += amountInr;
    const arr = expenseDetailByMonth.get(idx) ?? [];
    arr.push({ label: e.vendor || e.category || "expense", amount: amountInr });
    expenseDetailByMonth.set(idx, arr);
  }
  for (const p of pettyList) {
    const idx = idxOf(monthKey(p.spent_on));
    if (idx === null) continue;
    const amountInr = toInr(Number(p.amount || 0), p.currency, rates);
    buckets[idx].expenses += amountInr;
    const arr = expenseDetailByMonth.get(idx) ?? [];
    arr.push({ label: "petty cash", amount: amountInr });
    expenseDetailByMonth.set(idx, arr);
  }

  // Per-client phase costs, bucketed by each phase's own month (mirrors
  // revByClientMonth), with the per-phase line-items powering click-through.
  const costByClientMonth = new Map<string, Map<number, { total: number; phases: PhaseItem[] }>>();
  clientList.forEach((c) => {
    const perMonth = new Map<number, { total: number; phases: PhaseItem[] }>();
    for (const s of subsByClient.get(c.id) ?? []) {
      for (const ph of s.phases ?? []) {
        const idx = idxOf(monthKey(ph.date));
        if (idx === null) continue;
        const costInr = toInr(Math.max(0, Number(ph.cost || 0)), c.currency, rates);
        let entry = perMonth.get(idx);
        if (!entry) {
          entry = { total: 0, phases: [] };
          perMonth.set(idx, entry);
        }
        entry.total += costInr;
        entry.phases.push({ label: `${s.name}: ${ph.name}`, date: ph.date, amount: costInr });
      }
    }
    costByClientMonth.set(c.id, perMonth);
  });

  const costSeries: StackSeries[] = [
    { key: "expenses", name: "company expenses", color: "#9ca3af" },
    ...clientList.map((c) => ({ key: `cost_${c.id}`, name: c.name, color: clientColor(c) })),
  ];

  const costData: ChartRow[] = buckets.map((b) => {
    const row: ChartRow = { x: b.x, label: b.label, expenses: b.expenses };
    for (const c of clientList) {
      row[`cost_${c.id}`] = costByClientMonth.get(c.id)?.get(b.x)?.total ?? 0;
    }
    return row;
  });

  const costDetails: Record<string, StackDetail[]> = {};
  expenseDetailByMonth.forEach((items, idx) => {
    costDetails[`expenses|${idx}`] = items;
  });
  for (const c of clientList) {
    const perMonth = costByClientMonth.get(c.id);
    if (!perMonth) continue;
    perMonth.forEach((entry, monthIdx) => {
      costDetails[`cost_${c.id}|${monthIdx}`] = entry.phases;
    });
  }

  // Health board — worst first (red < amber < green < grey < completed).
  const order = { red: 0, amber: 1, green: 2, grey: 3, completed: 4 } as const;
  const board = clientList
    .map((c) => {
      const r = rollup(subsByClient.get(c.id) ?? [], c.kickoff_date);
      return { client: c, roll: r, health: healthColor(r.progress, r.count, r.offTrack, c.completed) };
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

      {/* Revenue timeline — a line per client at its own value; hover shows the
          month total + per-client split, clicking a dot reveals that client's phases */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-6">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// revenue over time (INR)"}</p>
        <StackedChart data={revData} series={revSeries} details={revDetails} />
      </div>

      {/* Cost timeline — company expenses + each client's phase costs as its
          own line at its own value; hover shows the month total + split, clicking
          a dot reveals that line's items */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-10">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// cost over time (INR)"}</p>
        <StackedChart data={costData} series={costSeries} details={costDetails} />
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
