import { createAdminClient } from "@/lib/supabase/admin";
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
import { RevenueCostChart, type MonthPoint, type DotPoint } from "./hq-charts";

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
  const admin = createAdminClient();
  const [{ data: clients }, { data: subs }, { data: petty }, { data: expenses }, rates] =
    await Promise.all([
      admin.from("clients").select("*").eq("archived", false),
      admin.from("client_subprojects").select("*"),
      admin.from("petty_cash").select("amount, currency, spent_on"),
      admin.from("company_expenses").select("amount, currency, incurred_on"),
      getInrRates(),
    ]);

  const clientList = (clients ?? []) as Client[];
  const subList = (subs ?? []) as Subproject[];
  const pettyList = (petty ?? []) as {
    amount: number;
    currency: string;
    spent_on: string | null;
  }[];
  const expenseList = (expenses ?? []) as {
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
  for (const c of clientList) {
    clientCurrency.set(c.id, c.currency);
    clientName.set(c.id, c.name);
  }

  const inr = summarizeInInr(clientList, subsByClient, pettyList, expenseList, rates);
  const expensesTotal = inr.pettyCash + inr.expenses;
  const subprojectCount = subList.length;

  // Monthly revenue-vs-cost timeline: last 12 months up to the current month.
  // We don't store dated revenue, so revenue is approximated from each
  // sub-project's created_at and cost from expense/petty/kickoff dates.
  const now = new Date();
  const months: MonthPoint[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const x = months.length;
    indexByKey.set(key, x);
    months.push({
      x,
      key,
      label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
      revenue: 0,
      cost: 0,
    });
  }
  const idxOf = (key: string | null): number | undefined =>
    key == null ? undefined : indexByKey.get(key);

  // Revenue = collected_revenue booked in the sub-project's created month.
  const revenueDots: DotPoint[] = [];
  for (const s of subList) {
    const idx = idxOf(monthKey(s.created_at));
    if (idx === undefined) continue;
    const cur = clientCurrency.get(s.client_id) ?? "INR";
    const value = toInr(Number(s.collected_revenue || 0), cur, rates);
    months[idx].revenue += value;
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
    if (idx !== undefined) months[idx].cost += toInr(Number(e.amount || 0), e.currency, rates);
  }
  for (const p of pettyList) {
    const idx = idxOf(monthKey(p.spent_on));
    if (idx !== undefined) months[idx].cost += toInr(Number(p.amount || 0), p.currency, rates);
  }
  const costDots: DotPoint[] = [];
  for (const c of clientList) {
    const idx = idxOf(monthKey(c.kickoff_date));
    if (idx === undefined) continue;
    const value = toInr(Number(c.cost || 0), c.currency, rates);
    months[idx].cost += value;
    costDots.push({ x: idx, value, name: c.name });
  }

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

      {/* Revenue vs cost timeline */}
      <div className="border border-dark/10 rounded-2xl bg-white p-5 mb-10">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// revenue vs cost over time (INR)"}</p>
        <RevenueCostChart data={months} revenueDots={revenueDots} costDots={costDots} />
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
