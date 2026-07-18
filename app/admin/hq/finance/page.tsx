import { createAdminClient } from "@/lib/supabase/admin";
import {
  rollup,
  toInr,
  summarizeByCurrency,
  formatMoney,
  type Client,
  type Subproject,
} from "@/lib/hq";
import { getInrRates } from "@/lib/fx";
import { type PettyCash } from "./petty-cash-row";
import ExpenseRow, { type Expense } from "./expense-row";
import { type Settlement } from "./settlement-row";
import { computeBalances, primaryBalance } from "./splitwise";
import FinanceCard from "./finance-card";
import PettyCashPanel from "./petty-cash-panel";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const admin = createAdminClient();
  const [
    { data: clients },
    { data: subs },
    { data: petty },
    { data: expenses },
    { data: settlements },
    rates,
  ] = await Promise.all([
    admin.from("clients").select("*").eq("archived", false),
    admin.from("client_subprojects").select("*"),
    admin.from("petty_cash").select("*").order("spent_on", { ascending: false }),
    admin.from("company_expenses").select("*").order("incurred_on", { ascending: false }),
    admin
      .from("petty_cash_settlements")
      .select("*")
      .order("settled_on", { ascending: false }),
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
  const settlementList = (settlements ?? []) as Settlement[];

  const totals = summarizeByCurrency(clientList, subsByClient, pettyList, expenseList);

  // INR-equivalent headline numbers so mixed-currency totals collapse to one
  // figure on the summary cards (detail drawers keep native currencies).
  const inrNet = totals.reduce((s, t) => s + toInr(t.net, t.currency, rates), 0);
  const inrContract = totals.reduce((s, t) => s + toInr(t.contract, t.currency, rates), 0);
  const inrExpenses = totals.reduce((s, t) => s + toInr(t.expenses, t.currency, rates), 0);

  // Per-client rows, ordered by contract value descending (INR-equivalent so
  // clients in different currencies rank consistently).
  const perClient = clientList
    .map((c) => ({ client: c, roll: rollup(subsByClient.get(c.id) ?? []) }))
    .sort(
      (a, b) =>
        toInr(b.roll.totalContract, b.client.currency, rates) -
        toInr(a.roll.totalContract, a.client.currency, rates)
    );

  const balances = computeBalances(pettyList, settlementList);
  const primary = primaryBalance(balances);

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Totals by currency */}
        <FinanceCard
          label="// totals by currency"
          headline={formatMoney(inrNet, "INR")}
          sub={`${totals.length} ${totals.length === 1 ? "currency" : "currencies"} · net cash (₹ equiv)`}
          title="Totals by currency"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </FinanceCard>

        {/* Per client */}
        <FinanceCard
          label="// per client"
          headline={formatMoney(inrContract, "INR")}
          sub={`${perClient.length} active ${perClient.length === 1 ? "client" : "clients"} · total contract (₹ equiv)`}
          title="Per client"
        >
          <div className="overflow-x-auto border border-dark/10 rounded-2xl bg-white">
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
        </FinanceCard>

        {/* Petty cash */}
        <FinanceCard
          label="// petty cash"
          headline={
            primary && primary.debtor
              ? formatMoney(primary.amount, primary.currency)
              : "Settled up"
          }
          sub={
            primary && primary.debtor
              ? `${primary.debtor} owes ${primary.creditor}${balances.length > 1 ? " · + other currencies" : ""}`
              : "all square between Vansh & Russhil"
          }
          title="Petty cash"
        >
          <PettyCashPanel entries={pettyList} settlements={settlementList} />
        </FinanceCard>

        {/* Company expenses */}
        <FinanceCard
          label="// company expenses"
          headline={formatMoney(inrExpenses, "INR")}
          sub={`${expenseList.length} ${expenseList.length === 1 ? "entry" : "entries"} · total (₹ equiv)`}
          title="Company expenses"
        >
          <div className="flex flex-col gap-3">
            {expenseList.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
            <div className="pt-2 border-t border-dark/10">
              <ExpenseRow />
            </div>
          </div>
        </FinanceCard>
      </div>
    </section>
  );
}
