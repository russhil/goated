import { createAdminClient } from "@/lib/supabase/admin";
import {
  rollup,
  healthColor,
  HEALTH_DOT,
  HEALTH_LABEL,
  summarizeByCurrency,
  formatMoney,
  type Client,
  type Subproject,
} from "@/lib/hq";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = createAdminClient();
  const [{ data: clients }, { data: subs }, { data: petty }, { data: expenses }] =
    await Promise.all([
      admin.from("clients").select("*").eq("archived", false),
      admin.from("client_subprojects").select("*"),
      admin.from("petty_cash").select("amount, currency"),
      admin.from("company_expenses").select("amount, currency"),
    ]);

  const clientList = (clients ?? []) as Client[];
  const subsByClient = new Map<string, Subproject[]>();
  for (const s of (subs ?? []) as Subproject[]) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const totals = summarizeByCurrency(
    clientList,
    subsByClient,
    (petty ?? []) as { amount: number; currency: string }[],
    (expenses ?? []) as { amount: number; currency: string }[]
  );

  const subprojectCount = (subs ?? []).length;

  // Client health board — worst first (red < amber < green < grey).
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
      {/* Counts */}
      <div className="flex items-center gap-6 flex-wrap mb-8 font-mono text-xs text-muted">
        <span>{clientList.length} active clients</span>
        <span>· {subprojectCount} sub-projects</span>
        <span>· <span className={offTrack ? "text-red-600" : "text-dark"}>{offTrack} off track</span></span>
      </div>

      {/* KPI tiles per currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {totals.map((t) => (
          <div key={t.currency} className="border border-dark/10 rounded-2xl p-5 bg-white">
            <p className="font-serif text-lg text-dark mb-3">{t.currency}</p>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Contract" value={formatMoney(t.contract, t.currency)} />
              <Kpi label="Collected" value={formatMoney(t.collected, t.currency)} />
              <Kpi label="Outstanding" value={formatMoney(t.outstanding, t.currency)} accent />
              <Kpi label="Net (cash)" value={formatMoney(t.net, t.currency)} />
            </div>
          </div>
        ))}
        {totals.length === 0 && <p className="font-sans text-muted">No clients yet — add one under Clients.</p>}
      </div>

      {/* Health board */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// client health"}</p>
      <ul className="flex flex-col gap-2">
        {board.map(({ client, roll, health }) => (
          <li key={client.id} className="border border-dark/10 rounded-xl bg-white px-5 py-3 flex items-center gap-4 flex-wrap">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${HEALTH_DOT[health]}`} title={HEALTH_LABEL[health]} />
            <a href="/admin/hq/clients" className="font-serif text-base text-dark min-w-[140px] hover:text-coral">
              {client.name}
            </a>
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest">{HEALTH_LABEL[health]}</span>
            <span className="font-mono text-xs text-dark">{roll.progress}%</span>
            <span className="font-sans text-sm text-coral ml-auto">
              {formatMoney(roll.outstanding, client.currency)} <span className="text-muted">outstanding</span>
            </span>
          </li>
        ))}
        {board.length === 0 && <p className="font-sans text-muted">No active clients.</p>}
      </ul>
    </section>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[10px] text-muted uppercase tracking-widest">{label}</p>
      <p className={`font-sans text-lg ${accent ? "text-coral" : "text-dark"}`}>{value}</p>
    </div>
  );
}
