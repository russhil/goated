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
import { MoneyBar, CategoryPie } from "./hq-charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = createAdminClient();
  const [{ data: clients }, { data: subs }, { data: petty }, { data: expenses }, rates] =
    await Promise.all([
      admin.from("clients").select("*").eq("archived", false),
      admin.from("client_subprojects").select("*"),
      admin.from("petty_cash").select("amount, currency"),
      admin.from("company_expenses").select("category, amount, currency"),
      getInrRates(),
    ]);

  const clientList = (clients ?? []) as Client[];
  const pettyList = (petty ?? []) as { amount: number; currency: string }[];
  const expenseList = (expenses ?? []) as {
    category: string;
    amount: number;
    currency: string;
  }[];

  const subsByClient = new Map<string, Subproject[]>();
  for (const s of (subs ?? []) as Subproject[]) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const inr = summarizeInInr(clientList, subsByClient, pettyList, expenseList, rates);
  const expensesTotal = inr.pettyCash + inr.expenses;
  const subprojectCount = (subs ?? []).length;

  // Chart data (INR).
  const barData = [
    { name: "Collected", value: inr.collected, fill: "#10b981" },
    { name: "Project cost", value: inr.cost, fill: "#0D0D0D" },
    { name: "Petty cash", value: inr.pettyCash, fill: "#f59e0b" },
    { name: "Company exp.", value: inr.expenses, fill: "#E8533A" },
  ];

  const catMap = new Map<string, number>();
  for (const e of expenseList) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + toInr(e.amount, e.currency, rates));
  }
  const pieData = [
    ...(inr.cost > 0 ? [{ name: "project cost", value: inr.cost }] : []),
    ...(inr.pettyCash > 0 ? [{ name: "petty cash", value: inr.pettyCash }] : []),
    ...Array.from(catMap.entries())
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value })),
  ];

  // Health board — worst first (red < amber < green < grey).
  const order = { red: 0, amber: 1, green: 2, grey: 3 } as const;
  const board = clientList
    .map((c) => {
      const r = rollup(subsByClient.get(c.id) ?? []);
      return { client: c, roll: r, health: healthColor(r.progress, r.count) };
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <div className="border border-dark/10 rounded-2xl bg-white p-5">
          <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// money overview (INR)"}</p>
          <MoneyBar data={barData} />
        </div>
        <div className="border border-dark/10 rounded-2xl bg-white p-5">
          <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">{"// cost & expense breakdown (INR)"}</p>
          {pieData.length > 0 ? (
            <CategoryPie data={pieData} />
          ) : (
            <div className="h-[280px] flex items-center justify-center">
              <p className="font-sans text-muted text-sm">No costs or expenses logged yet.</p>
            </div>
          )}
        </div>
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
