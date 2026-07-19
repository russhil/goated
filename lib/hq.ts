// Shared helpers for the Admin HQ internal-ops area (/admin/hq).
// The rollup() helper is the SINGLE place client totals are computed, so the
// clients page, dashboard, and finance page can never drift from each other.

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];

// The two partners for the Splitwise-style petty cash ledger.
export const PEOPLE = ["Vansh", "Russhil"] as const;
export type Person = (typeof PEOPLE)[number];

export const EXPENSE_CATEGORIES = [
  "rent",
  "salaries",
  "subscriptions",
  "software",
  "marketing",
  "travel",
  "misc",
] as const;

// Shared Tailwind class strings (match app/admin/case-study-row.tsx).
export const inputClass =
  "w-full px-3 py-2 border border-dark/10 rounded-lg bg-white text-sm font-sans focus:border-coral focus:outline-none";
export const labelClass =
  "font-mono text-[10px] text-muted uppercase tracking-widest block mb-1";

export type Credential = {
  label: string;
  username: string;
  secret: string;
  note: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
};

// A dated milestone on a sub-project that carries its own payment amount.
// A sub-project's collected_revenue is the sum of its phase amounts.
export type Phase = { name: string; date: string; amount: number };

export type Subproject = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  accrued_revenue: number;
  collected_revenue: number; // stored, kept = sum(phase amounts)
  progress: number; // stored, but derived from collected/accrued (see subProgress)
  due_date: string | null;
  phases: Phase[];
  contributor_ids: string[];
  sort_order: number;
  created_at: string;
};

export function phasesTotal(phases: Phase[]): number {
  if (!Array.isArray(phases)) return 0;
  return phases.reduce((s, p) => s + Math.max(0, Number(p.amount || 0)), 0);
}

export type Client = {
  id: string;
  name: string;
  industry: string | null;
  currency: string;
  github_url: string | null;
  db_url: string | null;
  live_url: string | null;
  description: string | null;
  story: string | null;
  cost: number;
  kickoff_date: string | null;
  credentials: Credential[];
  nda_path: string | null;
  contract_path: string | null;
  contributor_ids: string[];
  color: string | null; // chart color; null → palette fallback by index
  archived: boolean;
  created_at: string;
  updated_at: string;
};

// Fallback palette for clients without an assigned color (distinct, theme-safe).
export const CLIENT_COLORS = [
  "#E8533A",
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#eab308",
  "#3b82f6",
  "#ef4444",
];

export function clientColor(client: { color: string | null }, index: number): string {
  return client.color || CLIENT_COLORS[index % CLIENT_COLORS.length];
}

export type Rollup = {
  totalContract: number;
  collected: number;
  outstanding: number;
  progress: number; // 0-100, revenue-weighted, auto (collected/accrued)
  count: number;
  offTrackCount: number;
  offTrack: boolean;
};

type MoneyProgress = Pick<
  Subproject,
  "accrued_revenue" | "collected_revenue" | "due_date"
>;

// Progress is AUTO: how much of a sub-project's contract value is collected.
export function subProgress(sp: {
  accrued_revenue: number;
  collected_revenue: number;
}): number {
  const accrued = Number(sp.accrued_revenue || 0);
  if (accrued <= 0) return 0;
  return Math.min(100, Math.round((Number(sp.collected_revenue || 0) / accrued) * 100));
}

// A sub-project is off-track when it's past its due date and not fully
// collected, OR its collection is lagging >25 points behind the time elapsed
// from kickoff to due date.
export function subOffTrack(
  sp: { accrued_revenue: number; collected_revenue: number; due_date: string | null },
  kickoffDate: string | null
): boolean {
  const prog = subProgress(sp);
  if (prog >= 100) return false;
  if (!sp.due_date) return false;
  const now = new Date();
  const due = new Date(sp.due_date);
  if (Number.isNaN(due.getTime())) return false;
  if (now > due) return true;
  if (kickoffDate) {
    const start = new Date(kickoffDate);
    const total = due.getTime() - start.getTime();
    if (!Number.isNaN(start.getTime()) && total > 0) {
      const elapsedPct = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / total) * 100));
      if (prog < elapsedPct - 25) return true;
    }
  }
  return false;
}

export function rollup(
  subprojects: MoneyProgress[],
  kickoffDate: string | null = null
): Rollup {
  const totalContract = subprojects.reduce(
    (s, p) => s + Number(p.accrued_revenue || 0),
    0
  );
  const collected = subprojects.reduce(
    (s, p) => s + Number(p.collected_revenue || 0),
    0
  );
  let progress = 0;
  if (subprojects.length > 0) {
    if (totalContract > 0) {
      // revenue-weighted auto progress
      progress =
        subprojects.reduce((s, p) => s + subProgress(p) * Number(p.accrued_revenue || 0), 0) /
        totalContract;
    } else {
      progress =
        subprojects.reduce((s, p) => s + subProgress(p), 0) / subprojects.length;
    }
  }
  const offTrackCount = subprojects.filter((p) => subOffTrack(p, kickoffDate)).length;
  return {
    totalContract,
    collected,
    outstanding: totalContract - collected,
    progress: Math.round(progress),
    count: subprojects.length,
    offTrackCount,
    offTrack: offTrackCount > 0,
  };
}

export type Health = "green" | "amber" | "red" | "grey";

export function healthColor(progress: number, count: number, offTrack = false): Health {
  if (count === 0) return "grey";
  if (offTrack) return "red";
  if (progress >= 80) return "green";
  if (progress >= 40) return "amber";
  return "red";
}

export const HEALTH_DOT: Record<Health, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  grey: "bg-dark/20",
};

export const HEALTH_LABEL: Record<Health, string> = {
  green: "on track",
  amber: "at risk",
  red: "off track",
  grey: "no data",
};

export function formatMoney(amount: number, currency: string): string {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-IN")}`;
  }
}

export type CurrencyTotals = {
  currency: string;
  contract: number;
  collected: number;
  outstanding: number;
  cost: number;
  pettyCash: number;
  expenses: number;
  net: number;
};

// Group all money by currency (no FX conversion). Net is cash basis:
// collected - project cost - petty cash - company expenses.
export function summarizeByCurrency(
  clients: { id: string; currency: string; cost: number }[],
  subsByClient: Map<string, MoneyProgress[]>,
  pettyCash: { currency: string; amount: number }[],
  expenses: { currency: string; amount: number }[]
): CurrencyTotals[] {
  const map = new Map<string, CurrencyTotals>();
  const get = (cur: string) => {
    let t = map.get(cur);
    if (!t) {
      t = {
        currency: cur,
        contract: 0,
        collected: 0,
        outstanding: 0,
        cost: 0,
        pettyCash: 0,
        expenses: 0,
        net: 0,
      };
      map.set(cur, t);
    }
    return t;
  };
  for (const c of clients) {
    const r = rollup(subsByClient.get(c.id) ?? []);
    const t = get(c.currency);
    t.contract += r.totalContract;
    t.collected += r.collected;
    t.outstanding += r.outstanding;
    t.cost += Number(c.cost || 0);
  }
  for (const p of pettyCash) get(p.currency).pettyCash += Number(p.amount || 0);
  for (const e of expenses) get(e.currency).expenses += Number(e.amount || 0);
  for (const t of Array.from(map.values())) {
    t.net = t.collected - t.cost - t.pettyCash - t.expenses;
  }
  return Array.from(map.values()).sort((a, b) => b.contract - a.contract);
}

// Convert an amount to INR using an inrPerUnit rate map (see lib/fx.ts).
export function toInr(
  amount: number,
  currency: string,
  rates: Record<string, number>
): number {
  return Number(amount || 0) * (rates[currency] ?? 1);
}

export type InrTotals = {
  contract: number;
  collected: number;
  outstanding: number;
  cost: number;
  pettyCash: number;
  expenses: number;
  net: number;
};

// Single INR-unified rollup across every currency, converted at `rates`.
// Net is cash basis: collected - project cost - petty cash - company expenses.
export function summarizeInInr(
  clients: { id: string; currency: string; cost: number }[],
  subsByClient: Map<string, MoneyProgress[]>,
  pettyCash: { currency: string; amount: number }[],
  expenses: { currency: string; amount: number }[],
  rates: Record<string, number>
): InrTotals {
  let contract = 0;
  let collected = 0;
  let cost = 0;
  let pettyCashTotal = 0;
  let expensesTotal = 0;
  for (const c of clients) {
    const r = rollup(subsByClient.get(c.id) ?? []);
    contract += toInr(r.totalContract, c.currency, rates);
    collected += toInr(r.collected, c.currency, rates);
    cost += toInr(Number(c.cost || 0), c.currency, rates);
  }
  for (const p of pettyCash) pettyCashTotal += toInr(Number(p.amount || 0), p.currency, rates);
  for (const e of expenses) expensesTotal += toInr(Number(e.amount || 0), e.currency, rates);
  return {
    contract,
    collected,
    outstanding: contract - collected,
    cost,
    pettyCash: pettyCashTotal,
    expenses: expensesTotal,
    net: collected - cost - pettyCashTotal - expensesTotal,
  };
}
