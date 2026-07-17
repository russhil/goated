// Shared helpers for the Admin HQ internal-ops area (/admin/hq).
// The rollup() helper is the SINGLE place client totals are computed, so the
// clients page, dashboard, and finance page can never drift from each other.

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"] as const;
export type Currency = (typeof CURRENCIES)[number];

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

export type Subproject = {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  accrued_revenue: number;
  collected_revenue: number;
  progress: number;
  contributor_ids: string[];
  sort_order: number;
  created_at: string;
};

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
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Rollup = {
  totalContract: number;
  collected: number;
  outstanding: number;
  progress: number; // 0-100, revenue-weighted
  count: number;
};

type MoneyProgress = Pick<
  Subproject,
  "accrued_revenue" | "collected_revenue" | "progress"
>;

export function rollup(subprojects: MoneyProgress[]): Rollup {
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
      // revenue-weighted
      progress =
        subprojects.reduce(
          (s, p) => s + Number(p.progress || 0) * Number(p.accrued_revenue || 0),
          0
        ) / totalContract;
    } else {
      // fall back to simple average when all accrued = 0
      progress =
        subprojects.reduce((s, p) => s + Number(p.progress || 0), 0) /
        subprojects.length;
    }
  }
  return {
    totalContract,
    collected,
    outstanding: totalContract - collected,
    progress: Math.round(progress),
    count: subprojects.length,
  };
}

export type Health = "green" | "amber" | "red" | "grey";

export function healthColor(progress: number, count: number): Health {
  if (count === 0) return "grey";
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
