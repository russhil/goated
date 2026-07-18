import { createAdminClient } from "@/lib/supabase/admin";
import {
  rollup,
  toInr,
  summarizeByCurrency,
  formatMoney,
  type Client,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import { getInrRates } from "@/lib/fx";
import PettyCashRow, { type PettyCash } from "./petty-cash-row";
import ExpenseRow, { type Expense } from "./expense-row";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const admin = createAdminClient();
  const [{ data: clients }, { data: subs }, { data: petty }, { data: expenses }, { data: team }, rates] =
    await Promise.all([
      admin.from("clients").select("*").eq("archived", false),
      admin.from("client_subprojects").select("*"),
      admin.from("petty_cash").select("*").order("spent_on", { ascending: false }),
      admin.from("company_expenses").select("*").order("incurred_on", { ascending: false }),
      admin.from("team_members").select("*").order("name", { ascending: true }),
      getInrRates(),
    ]);

  const clientList = (clients ?? []) as Client[];
  const subsByClient = new Map<string, Subproject[]>();
  for (const s of (subs ?? []) as Subproject[]) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }
  const pettyList = (petty ?? []) as PettyCash[];
  const expenseList = (expenses ?? []) as Expense[];
  const teamList = (team ?? []) as TeamMember[];

  const totals = summarizeByCurrency(clientList, subsByClient, pettyList, expenseList);

  // Per-client rows, ordered by contract value descending (INR-equivalent so
  // clients in different currencies rank consistently).
  const perClient = clientList
    .map((c) => ({ client: c, roll: rollup(subsByClient.get(c.id) ?? []) }))
    .sort(
      (a, b) =>
        toInr(b.roll.totalContract, b.client.currency, rates) -
        toInr(a.roll.totalContract, a.client.currency, rates)
    );

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      {/* Totals by currency */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// totals by currency"}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {totals.map((t) => (
          <div key={t.currency} className="border border-dark/10 rounded-2xl p-5 bg-white">
            <p className="font-serif text-lg text-dark mb-3">{t.currency}</p>
            <dl className="grid grid-cols-2 gap-y-1 text-sm font-sans">
              <dt className="text-muted">Contract</dt><dd className="text-dark text-right">{formatMoney(t.contract, t.currency)}</dd>
              <dt className="text-muted">Collected</dt><dd className="text-dark text-right">{formatMoney(t.collected, t.currency)}</dd>
              <dt className="text-muted">Outstanding</dt><dd className="text-coral text-right">{formatMoney(t.outstanding, t.currency)}</dd>
              <dt className="text-muted">Project cost</dt><dd className="text-dark text-right">{formatMoney(t.cost, t.currency)}</dd>
              <dt className="text-muted">Petty cash</dt><dd className="text-dark text-right">{formatMoney(t.pettyCash, t.currency)}</dd>
              <dt className="text-muted">Expenses</dt><dd className="text-dark text-right">{formatMoney(t.expenses, t.currency)}</dd>
              <dt className="text-dark font-medium border-t border-dark/10 pt-1 mt-1">Net (cash)</dt>
              <dd className={`text-right font-medium border-t border-dark/10 pt-1 mt-1 ${t.net >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {formatMoney(t.net, t.currency)}
              </dd>
            </dl>
          </div>
        ))}
        {totals.length === 0 && <p className="font-sans text-muted">No financial data yet.</p>}
      </div>

      {/* Per-client table */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// per client"}</p>
      <div className="overflow-x-auto mb-10 border border-dark/10 rounded-2xl bg-white">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="text-left text-muted font-mono text-[10px] uppercase tracking-widest border-b border-dark/10">
              <th className="p-3">Client</th>
              <th className="p-3 text-right">Contract</th>
              <th className="p-3 text-right">Collected</th>
              <th className="p-3 text-right">Outstanding</th>
              <th className="p-3 text-right">Cost</th>
              <th className="p-3 text-right">Cash profit</th>
            </tr>
          </thead>
          <tbody>
            {perClient.map(({ client: c, roll: r }) => (
              <tr key={c.id} className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.02]">
                <td className="p-3 text-dark">
                  <a href={`/admin/hq/clients/${c.id}`} className="hover:text-coral">{c.name}</a>
                </td>
                <td className="p-3 text-right">{formatMoney(r.totalContract, c.currency)}</td>
                <td className="p-3 text-right">{formatMoney(r.collected, c.currency)}</td>
                <td className="p-3 text-right text-coral">{formatMoney(r.outstanding, c.currency)}</td>
                <td className="p-3 text-right">{formatMoney(c.cost, c.currency)}</td>
                <td className="p-3 text-right">{formatMoney(r.collected - Number(c.cost || 0), c.currency)}</td>
              </tr>
            ))}
            {perClient.length === 0 && (
              <tr><td className="p-3 text-muted" colSpan={6}>No active clients.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Petty cash ledger */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// petty cash"}</p>
      <div className="border border-dark/10 rounded-2xl p-5 bg-white mb-10 flex flex-col gap-3">
        {pettyList.map((p) => (
          <PettyCashRow key={p.id} entry={p} team={teamList} />
        ))}
        <div className="pt-2 border-t border-dark/10">
          <PettyCashRow team={teamList} />
        </div>
      </div>

      {/* Company expenses ledger */}
      <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// company expenses"}</p>
      <div className="border border-dark/10 rounded-2xl p-5 bg-white flex flex-col gap-3">
        {expenseList.map((e) => (
          <ExpenseRow key={e.id} expense={e} />
        ))}
        <div className="pt-2 border-t border-dark/10">
          <ExpenseRow />
        </div>
      </div>
    </section>
  );
}
