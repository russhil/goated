# Admin HQ Internal Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only internal system under `/admin/hq` to track clients, their sub-projects, project health, and company finances (petty cash + expenses), with all client/dashboard/finance totals derived live from sub-projects.

**Architecture:** Real routes under `/admin/hq`, gated once by a layout that reuses `isAdmin()`. Every mutation is a `requireAdmin()`-gated server action writing through the service-role client to service-role-only tables (RLS on, zero policies). Client contract/collected/outstanding/progress are never stored — they are computed from `client_subprojects` by a single shared helper (`lib/hq.ts` `rollup()`), so editing a sub-project updates the client card, dashboard, and finance automatically. PDFs live in a private Storage bucket, served via short-lived signed URLs.

**Tech Stack:** Next.js 14 App Router (Server Components + Server Actions), React 18, TypeScript, Tailwind, Supabase (service-role client + Storage), supabase-js 2.105.4.

## Global Constraints

- **No test runner exists.** CLAUDE.md: "No test framework is set up. Verify changes via `tsc --noEmit` and by exercising the dev server manually." Every task's verification is `npx tsc --noEmit` (must be clean) plus a scoped manual dev-server check. Do **not** add a test framework.
- **Service-role client only from admin-gated code.** `createAdminClient()` (from `@/lib/supabase/admin`) may only be called inside code already gated by `requireAdmin()`/`isAdmin()`.
- **Server action convention:** each mutating action starts with `requireAdmin()` and ends with the relevant `revalidatePath()` (here: `revalidateHq()` → `/admin/hq`, `/admin/hq/clients`, `/admin/hq/finance`).
- **Path alias:** `@/` maps to repo root.
- **Schema is applied manually** in the Supabase SQL editor; `supabase/schema.sql` must stay idempotent (`create table if not exists`, `drop ... if exists`, `on conflict do nothing`).
- **Design tokens:** colors `coral #E8533A`, `dark #0D0D0D`, `muted #999999`, `light #F5F5F5`; fonts `font-serif`, `font-sans`, `font-mono`; utility `.section-label`. Match the existing admin visual style (see `app/admin/case-study-row.tsx`).
- **Currencies:** `INR, USD, EUR, GBP, AED`. **Expense categories:** `rent, salaries, subscriptions, software, marketing, travel, misc`. Health thresholds: `≥80` green, `40–79` amber, `<40` red, `0 sub-projects` grey.

---

### Task 1: Database schema + private storage bucket

**Files:**
- Modify: `supabase/schema.sql` (append a new section 10 at end of file)

**Interfaces:**
- Produces: tables `team_members`, `clients`, `client_subprojects`, `petty_cash`, `company_expenses`; view `client_financials`; private bucket `client-docs`. All consumed by later tasks via the service-role client.

- [ ] **Step 1: Append the DDL to `supabase/schema.sql`**

Append exactly:

```sql
-- ============================================================================
-- 10. Internal Ops (Admin HQ) — clients, sub-projects, finances
--
-- Admin-only back office at /admin/hq. All tables are service-role only
-- (RLS on, zero policies) — every read/write goes through requireAdmin()
-- server actions using the service-role key. Client contract/collected totals
-- are NOT stored here; they are derived from client_subprojects.
-- ============================================================================

-- 10.1 Team roster (contributors + petty-cash payers)
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  email       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.team_members enable row level security;
-- No policies — service role only.

-- 10.2 Clients
create table if not exists public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  industry        text,
  currency        text not null default 'INR',
  github_url      text,
  db_url          text,
  live_url        text,
  description     text,
  story           text,
  cost            numeric(14,2) not null default 0,
  kickoff_date    date,
  credentials     jsonb not null default '[]'::jsonb,   -- [{label,username,secret,note}]
  nda_path        text,
  contract_path   text,
  contributor_ids uuid[] not null default '{}',
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists clients_archived_idx on public.clients (archived, created_at desc);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
-- No policies — service role only.

-- 10.3 Sub-projects (the source of truth for client money + progress)
create table if not exists public.client_subprojects (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references public.clients(id) on delete cascade,
  name              text not null,
  description       text,
  accrued_revenue   numeric(14,2) not null default 0,
  collected_revenue numeric(14,2) not null default 0,
  progress          int not null default 0 check (progress between 0 and 100),
  contributor_ids   uuid[] not null default '{}',
  sort_order        int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists client_subprojects_client_idx
  on public.client_subprojects (client_id, sort_order asc, created_at asc);

drop trigger if exists client_subprojects_set_updated_at on public.client_subprojects;
create trigger client_subprojects_set_updated_at
  before update on public.client_subprojects
  for each row execute function public.set_updated_at();

alter table public.client_subprojects enable row level security;
-- No policies — service role only.

-- 10.4 Petty cash ledger
create table if not exists public.petty_cash (
  id          uuid primary key default gen_random_uuid(),
  paid_by_id  uuid references public.team_members(id) on delete set null,
  purpose     text not null,
  amount      numeric(14,2) not null,
  currency    text not null default 'INR',
  spent_on    date not null,
  created_at  timestamptz not null default now()
);

create index if not exists petty_cash_spent_idx on public.petty_cash (spent_on desc);

alter table public.petty_cash enable row level security;
-- No policies — service role only.

-- 10.5 Company expenses ledger
create table if not exists public.company_expenses (
  id               uuid primary key default gen_random_uuid(),
  category         text not null default 'misc',
  vendor           text,
  description      text,
  amount           numeric(14,2) not null,
  currency         text not null default 'INR',
  incurred_on      date not null,
  recurring        boolean not null default false,
  recurring_period text,
  created_at       timestamptz not null default now()
);

create index if not exists company_expenses_incurred_idx on public.company_expenses (incurred_on desc);

alter table public.company_expenses enable row level security;
-- No policies — service role only.

-- 10.6 Derived rollup view (inspection only — the app computes rollups in JS).
-- security_invoker + revoke keep anon/authenticated from reading client money
-- through PostgREST.
create or replace view public.client_financials
  with (security_invoker = true) as
select
  c.id as client_id,
  coalesce(sum(sp.accrued_revenue), 0)                             as total_contract,
  coalesce(sum(sp.collected_revenue), 0)                           as collected_revenue,
  coalesce(sum(sp.accrued_revenue), 0)
    - coalesce(sum(sp.collected_revenue), 0)                       as outstanding,
  case
    when coalesce(sum(sp.accrued_revenue), 0) > 0
      then sum(sp.progress * sp.accrued_revenue) / sum(sp.accrued_revenue)
    else coalesce(avg(sp.progress), 0)
  end                                                              as avg_progress,
  count(sp.id)                                                     as subproject_count
from public.clients c
left join public.client_subprojects sp on sp.client_id = c.id
group by c.id;

revoke all on public.client_financials from anon, authenticated;

-- 10.7 Private bucket for NDA / Contract PDFs.
insert into storage.buckets (id, name, public)
values ('client-docs', 'client-docs', false)
on conflict (id) do nothing;
```

- [ ] **Step 2: Verify the SQL parses (local sanity, no DB)**

Run: `grep -c "create table if not exists public.clients" supabase/schema.sql`
Expected: `1`

- [ ] **Step 3: Apply manually in Supabase**

This is a manual step for the operator: paste the whole `supabase/schema.sql` into the Supabase SQL editor and Run. Re-running must be a no-op. (Agent cannot execute this; note it in the task handoff.)

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat(hq): schema for internal ops — clients, sub-projects, finances"
```

---

### Task 2: Shared helpers `lib/hq.ts`

**Files:**
- Create: `lib/hq.ts`

**Interfaces:**
- Produces: types `Credential`, `TeamMember`, `Subproject`, `Client`, `Rollup`, `Health`, `CurrencyTotals`; consts `CURRENCIES`, `EXPENSE_CATEGORIES`, `HEALTH_DOT`, `HEALTH_LABEL`, `inputClass`, `labelClass`; functions `rollup()`, `healthColor()`, `formatMoney()`, `summarizeByCurrency()`. Consumed by every later task.

- [ ] **Step 1: Create `lib/hq.ts`**

```ts
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
  for (const t of map.values()) {
    t.net = t.collected - t.cost - t.pettyCash - t.expenses;
  }
  return [...map.values()].sort((a, b) => b.contract - a.contract);
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/hq.ts
git commit -m "feat(hq): shared types + rollup/format helpers"
```

---

### Task 3: HQ layout, guard, sub-nav, and route stubs

**Files:**
- Create: `app/admin/hq/guard.ts`
- Create: `app/admin/hq/hq-nav.tsx`
- Create: `app/admin/hq/layout.tsx`
- Create: `app/admin/hq/page.tsx` (dashboard stub)
- Create: `app/admin/hq/clients/page.tsx` (stub)
- Create: `app/admin/hq/finance/page.tsx` (stub)

**Interfaces:**
- Produces: `requireAdmin()` → `{admin:false} | {admin:true, user}`, `revalidateHq()`, `type Result` from `app/admin/hq/guard.ts`, consumed by all action files.

- [ ] **Step 1: Create `app/admin/hq/guard.ts`**

```ts
// Shared server-side guard + revalidation for /admin/hq server actions.
// NOT a "use server" file — it exports sync helpers and a type too.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export type Result = { ok: boolean; error?: string };

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return { admin: false as const };
  }
  return { admin: true as const, user };
}

export function revalidateHq() {
  revalidatePath("/admin/hq");
  revalidatePath("/admin/hq/clients");
  revalidatePath("/admin/hq/finance");
}
```

- [ ] **Step 2: Create `app/admin/hq/hq-nav.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/hq", label: "Dashboard" },
  { href: "/admin/hq/clients", label: "Clients" },
  { href: "/admin/hq/finance", label: "Finance" },
];

export default function HqNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-2 mb-2">
      {TABS.map((t) => {
        const active =
          t.href === "/admin/hq"
            ? pathname === t.href
            : pathname.startsWith(t.href);
        return (
          <a
            key={t.href}
            href={t.href}
            className={`px-4 py-2 rounded-full text-sm font-sans transition ${
              active
                ? "bg-dark text-white"
                : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
            }`}
          >
            {t.label}
          </a>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/hq/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import HqNav from "./hq-nav";

export const metadata: Metadata = {
  title: "Client HQ",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/explore?signin=1&next=/admin/hq");
  }

  if (!isAdmin(user.email)) {
    return (
      <main>
        <Navbar />
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="font-mono text-xs text-coral uppercase tracking-widest mb-4">
              {"// 403 — not on the allowlist"}
            </p>
            <h1
              className="font-serif text-dark mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              You&apos;re signed in, but not as an admin.
            </h1>
            <p className="font-sans text-muted mb-8">
              Signed in as{" "}
              <span className="text-dark font-medium">{user.email}</span>.
            </p>
            <form action="/auth/sign-out" method="post" className="inline-block">
              <button
                type="submit"
                className="px-6 py-3 bg-dark text-white rounded-full text-sm font-medium hover:bg-coral transition-colors"
              >
                Sign out and try a different email
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="section-label">{"// internal ops"}</div>
        <h1
          className="font-serif text-dark leading-[1.1] mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          Client HQ.
        </h1>
        <p className="font-mono text-xs text-muted/70 mb-6">
          {"// signed in as "}
          <span className="text-dark">{user.email}</span>
        </p>
        <HqNav />
      </section>
      {children}
    </main>
  );
}
```

- [ ] **Step 4: Create the three stub pages**

`app/admin/hq/page.tsx`:
```tsx
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <section className="px-6 md:px-12 pb-24 max-w-[1200px] mx-auto">
      <p className="font-mono text-xs text-muted">{"// dashboard — coming in Task 10"}</p>
    </section>
  );
}
```

`app/admin/hq/clients/page.tsx`:
```tsx
export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <section className="px-6 md:px-12 pb-24 max-w-[1200px] mx-auto">
      <p className="font-mono text-xs text-muted">{"// clients — coming in Task 5"}</p>
    </section>
  );
}
```

`app/admin/hq/finance/page.tsx`:
```tsx
export const dynamic = "force-dynamic";

export default function FinancePage() {
  return (
    <section className="px-6 md:px-12 pb-24 max-w-[1200px] mx-auto">
      <p className="font-mono text-xs text-muted">{"// finance — coming in Task 9"}</p>
    </section>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`. Signed in as an admin, visit `/admin/hq`, `/admin/hq/clients`, `/admin/hq/finance`: header "Client HQ." shows, sub-nav highlights the active tab, each stub renders. Signed out or as a non-admin, `/admin/hq` redirects to sign-in / shows the 403.

- [ ] **Step 7: Commit**

```bash
git add app/admin/hq
git commit -m "feat(hq): admin-gated layout, sub-nav, and route stubs"
```

---

### Task 4: Team roster (create/edit/delete + UI on Clients page)

**Files:**
- Create: `app/admin/hq/clients/team-actions.ts`
- Create: `app/admin/hq/clients/team-manager.tsx`
- Modify: `app/admin/hq/clients/page.tsx` (render the roster; still a partial page)

**Interfaces:**
- Consumes: `requireAdmin`, `revalidateHq`, `Result` from `../guard`; `TeamMember`, `inputClass`, `labelClass` from `@/lib/hq`.
- Produces: `createTeamMember(TeamMemberInput)`, `updateTeamMember(id, TeamMemberInput)`, `deleteTeamMember(id)`, `type TeamMemberInput`.

- [ ] **Step 1: Create `app/admin/hq/clients/team-actions.ts`**

```ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";

export type TeamMemberInput = {
  name: string;
  role: string;
  email: string;
  active: boolean;
};

function memberPayload(input: TeamMemberInput) {
  return {
    name: input.name.trim(),
    role: (input.role || "").trim() || null,
    email: (input.email || "").trim() || null,
    active: Boolean(input.active),
  };
}

export async function createTeamMember(input: TeamMemberInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = memberPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("team_members").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateTeamMember(
  id: string,
  input: TeamMemberInput
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = memberPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("team_members").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

// Deleting a member scrubs their id from every contributor_ids array.
// petty_cash.paid_by_id clears automatically via ON DELETE SET NULL.
export async function deleteTeamMember(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();

  const { data: clients } = await admin
    .from("clients")
    .select("id, contributor_ids")
    .contains("contributor_ids", [id]);
  for (const c of clients ?? []) {
    await admin
      .from("clients")
      .update({
        contributor_ids: (c.contributor_ids as string[]).filter((x) => x !== id),
      })
      .eq("id", c.id);
  }

  const { data: subs } = await admin
    .from("client_subprojects")
    .select("id, contributor_ids")
    .contains("contributor_ids", [id]);
  for (const s of subs ?? []) {
    await admin
      .from("client_subprojects")
      .update({
        contributor_ids: (s.contributor_ids as string[]).filter((x) => x !== id),
      })
      .eq("id", s.id);
  }

  const { error } = await admin.from("team_members").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
```

- [ ] **Step 2: Create `app/admin/hq/clients/team-manager.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { inputClass, type TeamMember } from "@/lib/hq";
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMemberInput,
} from "./team-actions";

function MemberRow({ member }: { member?: TeamMember }) {
  const isNew = !member;
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [active, setActive] = useState(member?.active ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): TeamMemberInput => ({ name, role, email, active });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createTeamMember(build())
        : await updateTeamMember(member!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setName("");
        setRole("");
        setEmail("");
        setActive(true);
      }
    });
  };

  const remove = () => {
    if (!member) return;
    if (!window.confirm(`Remove ${member.name} from the roster?`)) return;
    startTransition(async () => {
      const res = await deleteTeamMember(member.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        className={`${inputClass} max-w-[180px]`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        className={`${inputClass} max-w-[150px]`}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role"
      />
      <input
        className={`${inputClass} max-w-[200px]`}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email (optional)"
      />
      <label className="flex items-center gap-1 font-mono text-[11px] text-muted">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-coral"
        />
        active
      </label>
      <button
        onClick={save}
        disabled={pending || !name.trim()}
        className="px-4 py-2 bg-dark text-white text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40"
      >
        {isNew ? "Add" : "Save"}
      </button>
      {!isNew && (
        <button
          onClick={remove}
          disabled={pending}
          className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
        >
          remove
        </button>
      )}
      {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
    </div>
  );
}

export default function TeamManager({ team }: { team: TeamMember[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dark/10 rounded-2xl p-6 bg-light/40 mb-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[11px] text-coral uppercase tracking-widest"
      >
        {open ? "▾" : "▸"} team roster ({team.length})
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {team.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
          <div className="pt-2 border-t border-dark/10">
            <MemberRow />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Replace `app/admin/hq/clients/page.tsx` with a version that loads + renders the roster**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamMember } from "@/lib/hq";
import TeamManager from "./team-manager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <TeamManager team={(team ?? []) as TeamMember[]} />
      <p className="font-mono text-xs text-muted">{"// client cards — coming in Task 5"}</p>
    </section>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual check**

On `/admin/hq/clients`, expand "team roster", add a member, edit it, toggle active, remove it. Confirm each persists across a refresh.

- [ ] **Step 6: Commit**

```bash
git add app/admin/hq/clients
git commit -m "feat(hq): team roster CRUD"
```

---

### Task 5: Clients — CRUD, list, archive, and the collapsed/expanded card (core fields)

**Files:**
- Create: `app/admin/hq/clients/actions.ts`
- Create: `app/admin/hq/clients/contributor-picker.tsx`
- Create: `app/admin/hq/clients/client-row.tsx`
- Modify: `app/admin/hq/clients/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin`, `revalidateHq`, `Result`; `CURRENCIES`, `Client`, `Subproject`, `TeamMember`, `Credential`, `rollup`, `healthColor`, `HEALTH_DOT`, `HEALTH_LABEL`, `formatMoney`, `inputClass`, `labelClass`.
- Produces: `createClient(ClientInput)`, `updateClient(id, ClientInput)`, `archiveClient(id)`, `restoreClient(id)`, `deleteClient(id)`, `type ClientInput`. (Sub-project, credential, and PDF fields are wired in Tasks 6–8.)

> **Note for the implementer:** the big form scaffolding (one `useState` per field, a `useTransition` save, a delete with `window.confirm`, `savedAt` flash, `error` line) directly mirrors `app/admin/case-study-row.tsx` — read that file first; this component follows the same shape.

- [ ] **Step 1: Create `app/admin/hq/clients/actions.ts`**

```ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";
import { CURRENCIES, type Credential } from "@/lib/hq";

export type ClientInput = {
  name: string;
  industry: string;
  currency: string;
  github_url: string;
  db_url: string;
  live_url: string;
  description: string;
  story: string;
  cost: number;
  kickoff_date: string; // "yyyy-mm-dd" or ""
  credentials: Credential[];
  contributor_ids: string[];
};

function sanitizeCredentials(creds: Credential[]): Credential[] {
  if (!Array.isArray(creds)) return [];
  return creds
    .map((c) => ({
      label: (c.label || "").trim(),
      username: (c.username || "").trim(),
      secret: (c.secret || "").trim(),
      note: (c.note || "").trim(),
    }))
    .filter((c) => c.label || c.username || c.secret || c.note);
}

function clientPayload(input: ClientInput) {
  return {
    name: input.name.trim(),
    industry: (input.industry || "").trim() || null,
    currency: CURRENCIES.includes(input.currency as (typeof CURRENCIES)[number])
      ? input.currency
      : "INR",
    github_url: (input.github_url || "").trim() || null,
    db_url: (input.db_url || "").trim() || null,
    live_url: (input.live_url || "").trim() || null,
    description: (input.description || "").trim() || null,
    story: (input.story || "").trim() || null,
    cost: Number.isFinite(input.cost) ? input.cost : 0,
    kickoff_date: input.kickoff_date ? input.kickoff_date : null,
    credentials: sanitizeCredentials(input.credentials),
    contributor_ids: Array.isArray(input.contributor_ids)
      ? input.contributor_ids.filter(Boolean)
      : [],
  };
}

export async function createClient(input: ClientInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateClient(id: string, input: ClientInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function archiveClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: true }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function restoreClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

// Hard delete: removes PDFs from storage, cascades sub-projects.
export async function deleteClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("nda_path, contract_path")
    .eq("id", id)
    .single();
  const paths = [client?.nda_path, client?.contract_path].filter(Boolean) as string[];
  if (paths.length) await admin.storage.from("client-docs").remove(paths);

  const { error } = await admin.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
```

- [ ] **Step 2: Create `app/admin/hq/clients/contributor-picker.tsx`**

```tsx
"use client";

import { labelClass, type TeamMember } from "@/lib/hq";

export default function ContributorPicker({
  team,
  value,
  onChange,
  label = "// contributors",
}: {
  team: TeamMember[];
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const active = team.filter((m) => m.active || value.includes(m.id));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {active.length === 0 ? (
        <p className="font-mono text-[11px] text-muted">
          {"// add people to the team roster first"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {active.map((m) => {
            const on = value.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-sans transition ${
                  on
                    ? "bg-dark text-white"
                    : "bg-dark/[0.04] text-dark/60 hover:bg-dark/10"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/hq/clients/client-row.tsx`** (core fields; sub-projects/credentials/PDF placeholders wired in Tasks 6–8)

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  CURRENCIES,
  rollup,
  healthColor,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  inputClass,
  labelClass,
  type Client,
  type Subproject,
  type TeamMember,
  type Credential,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
import {
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  deleteClient,
  type ClientInput,
} from "./actions";

export default function ClientRow({
  client,
  subprojects = [],
  team,
}: {
  client?: Client;
  subprojects?: Subproject[];
  team: TeamMember[];
}) {
  const isNew = !client;
  const [expanded, setExpanded] = useState(isNew);

  const [name, setName] = useState(client?.name ?? "");
  const [industry, setIndustry] = useState(client?.industry ?? "");
  const [currency, setCurrency] = useState(client?.currency ?? "INR");
  const [githubUrl, setGithubUrl] = useState(client?.github_url ?? "");
  const [dbUrl, setDbUrl] = useState(client?.db_url ?? "");
  const [liveUrl, setLiveUrl] = useState(client?.live_url ?? "");
  const [description, setDescription] = useState(client?.description ?? "");
  const [story, setStory] = useState(client?.story ?? "");
  const [cost, setCost] = useState(client?.cost ?? 0);
  const [kickoffDate, setKickoffDate] = useState(client?.kickoff_date ?? "");
  const [credentials, setCredentials] = useState<Credential[]>(
    client?.credentials ?? []
  );
  const [contributorIds, setContributorIds] = useState<string[]>(
    client?.contributor_ids ?? []
  );

  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const roll = rollup(subprojects);
  const health = healthColor(roll.progress, roll.count);

  const buildInput = (): ClientInput => ({
    name,
    industry,
    currency,
    github_url: githubUrl,
    db_url: dbUrl,
    live_url: liveUrl,
    description,
    story,
    cost: Number(cost) || 0,
    kickoff_date: kickoffDate,
    credentials,
    contributor_ids: contributorIds,
  });

  const resetForm = () => {
    setName("");
    setIndustry("");
    setCurrency("INR");
    setGithubUrl("");
    setDbUrl("");
    setLiveUrl("");
    setDescription("");
    setStory("");
    setCost(0);
    setKickoffDate("");
    setCredentials([]);
    setContributorIds([]);
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createClient(buildInput())
        : await updateClient(client!.id, buildInput());
      if (res.ok) {
        setSavedAt(Date.now());
        if (isNew) resetForm();
      } else {
        setError(res.error || "save failed");
      }
    });
  };

  const handleArchive = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await archiveClient(client.id);
      if (!res.ok) setError(res.error || "archive failed");
    });
  };

  const handleRestore = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await restoreClient(client.id);
      if (!res.ok) setError(res.error || "restore failed");
    });
  };

  const handleDelete = () => {
    if (!client) return;
    if (!window.confirm(`Permanently delete "${client.name}" and all its sub-projects? This cannot be undone.`))
      return;
    startTransition(async () => {
      const res = await deleteClient(client.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <li className="border border-dark/10 rounded-2xl bg-white overflow-hidden">
      {/* Collapsed summary — priority order left→right */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-6 py-4 flex items-center gap-4 flex-wrap hover:bg-dark/[0.02]"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${HEALTH_DOT[health]}`}
          title={HEALTH_LABEL[health]}
        />
        <span className="font-serif text-lg text-dark min-w-[140px]">
          {isNew ? "New client" : client!.name}
        </span>
        {!isNew && (
          <>
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest min-w-[90px]">
              {client!.industry || "—"}
            </span>
            <span className="font-sans text-sm text-dark">
              {formatMoney(roll.totalContract, currency)}
              <span className="text-muted"> contract</span>
            </span>
            <span className="font-sans text-sm text-dark">
              {formatMoney(roll.collected, currency)}
              <span className="text-muted"> collected</span>
            </span>
            <span className="font-sans text-sm text-coral">
              {formatMoney(roll.outstanding, currency)}
              <span className="text-muted"> outstanding</span>
            </span>
            <span className="font-mono text-xs text-dark">{roll.progress}%</span>
            <span className="font-mono text-[11px] text-muted ml-auto">
              {client!.kickoff_date || "no kickoff"}
            </span>
          </>
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-dark/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>// client name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className={labelClass}>// industry</label>
              <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Fintech" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelClass}>// currency</label>
              <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>// cost of project</label>
              <input type="number" className={inputClass} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>// kickoff date</label>
              <input type="date" className={inputClass} value={kickoffDate} onChange={(e) => setKickoffDate(e.target.value)} />
            </div>
            <div className="flex flex-col justify-end">
              <span className="font-mono text-[10px] text-muted uppercase tracking-widest">// profit (contract − cost)</span>
              <span className="font-sans text-sm text-dark">
                {formatMoney(roll.totalContract - (Number(cost) || 0), currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>// github link</label>
              <input className={inputClass} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div>
              <label className={labelClass}>// db link</label>
              <input className={inputClass} value={dbUrl} onChange={(e) => setDbUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>// live link</label>
              <input className={inputClass} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>// description</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="mb-4">
            <label className={labelClass}>// story / progress notes</label>
            <textarea className={`${inputClass} resize-none`} rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
          </div>

          <div className="mb-5">
            <ContributorPicker team={team} value={contributorIds} onChange={setContributorIds} />
          </div>

          {/* CREDENTIALS_SLOT — replaced in Task 7 */}
          {/* SUBPROJECTS_SLOT — replaced in Task 6 */}
          {/* PDF_SLOT — replaced in Task 8 */}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={pending || name.trim() === ""}
                className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pending ? "Saving..." : isNew ? "Create client" : "Save changes"}
              </button>
              {savedAt && !error && (
                <span className="font-mono text-[11px] text-emerald-700">
                  {isNew ? "// created" : "// saved"}
                </span>
              )}
              {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
            </div>
            {!isNew && (
              <div className="flex items-center gap-4">
                {client!.archived ? (
                  <button onClick={handleRestore} disabled={pending} className="font-mono text-[11px] text-emerald-700 hover:underline disabled:opacity-40">
                    restore
                  </button>
                ) : (
                  <button onClick={handleArchive} disabled={pending} className="font-mono text-[11px] text-dark/60 hover:underline disabled:opacity-40">
                    archive
                  </button>
                )}
                <button onClick={handleDelete} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
                  delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
```

- [ ] **Step 4: Replace `app/admin/hq/clients/page.tsx`** to load clients + sub-projects and render cards + archived filter

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { type Client, type Subproject, type TeamMember } from "@/lib/hq";
import TeamManager from "./team-manager";
import ClientRow from "./client-row";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { archived?: string };
}) {
  const showArchived = searchParams.archived === "1";
  const admin = createAdminClient();

  const [{ data: team }, { data: clients }, { data: subs }] = await Promise.all([
    admin.from("team_members").select("*").order("name", { ascending: true }),
    admin
      .from("clients")
      .select("*")
      .eq("archived", showArchived)
      .order("created_at", { ascending: false }),
    admin
      .from("client_subprojects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const subsByClient = new Map<string, Subproject[]>();
  for (const s of (subs ?? []) as Subproject[]) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const teamList = (team ?? []) as TeamMember[];
  const clientList = (clients ?? []) as Client[];

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <TeamManager team={teamList} />

      <div className="flex items-center gap-2 mb-6">
        <a
          href="/admin/hq/clients"
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
            !showArchived ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
          }`}
        >
          active
        </a>
        <a
          href="/admin/hq/clients?archived=1"
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
            showArchived ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
          }`}
        >
          archived
        </a>
      </div>

      {!showArchived && (
        <div className="mb-8">
          <p className="font-serif text-xl text-dark mb-4">Add a client</p>
          <ul className="flex flex-col gap-4">
            <ClientRow team={teamList} />
          </ul>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {clientList.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            subprojects={subsByClient.get(c.id) ?? []}
            team={teamList}
          />
        ))}
      </ul>

      {clientList.length === 0 && (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center mt-4">
          <p className="font-serif text-2xl text-dark mb-3">
            {showArchived ? "No archived clients." : "No clients yet."}
          </p>
          <p className="font-sans text-muted">
            {showArchived ? "Archived clients show up here." : "Add your first client above."}
          </p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Add a client (name + currency + cost + kickoff). Confirm it appears as a collapsed card with a grey health dot (no sub-projects yet) and ₹0 contract. Expand, edit a field, save. Archive it → it leaves "active", appears under "archived", and can be restored. Delete removes it.

- [ ] **Step 7: Commit**

```bash
git add app/admin/hq/clients
git commit -m "feat(hq): client CRUD, archive/restore, collapsed/expanded card"
```

---

### Task 6: Sub-projects (nested CRUD; totals roll up)

**Files:**
- Modify: `app/admin/hq/clients/actions.ts` (add sub-project actions)
- Create: `app/admin/hq/clients/subproject-row.tsx`
- Modify: `app/admin/hq/clients/client-row.tsx` (replace `SUBPROJECTS_SLOT`)

**Interfaces:**
- Consumes: `requireAdmin`, `revalidateHq`, `Result`; `Subproject`, `TeamMember`, `formatMoney`, `inputClass`, `labelClass`, `ContributorPicker`.
- Produces: `createSubproject(clientId, SubprojectInput)`, `updateSubproject(id, SubprojectInput)`, `deleteSubproject(id)`, `type SubprojectInput`.

- [ ] **Step 1: Append sub-project actions to `app/admin/hq/clients/actions.ts`**

```ts
export type SubprojectInput = {
  name: string;
  description: string;
  accrued_revenue: number;
  collected_revenue: number;
  progress: number;
  contributor_ids: string[];
  sort_order: number;
};

function subprojectPayload(input: SubprojectInput) {
  return {
    name: input.name.trim(),
    description: (input.description || "").trim() || null,
    accrued_revenue: Number.isFinite(input.accrued_revenue) ? input.accrued_revenue : 0,
    collected_revenue: Number.isFinite(input.collected_revenue) ? input.collected_revenue : 0,
    progress: Math.min(100, Math.max(0, Math.round(Number(input.progress) || 0))),
    contributor_ids: Array.isArray(input.contributor_ids)
      ? input.contributor_ids.filter(Boolean)
      : [],
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
  };
}

export async function createSubproject(
  clientId: string,
  input: SubprojectInput
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = subprojectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("client_subprojects")
    .insert({ client_id: clientId, ...payload });
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateSubproject(
  id: string,
  input: SubprojectInput
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = subprojectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteSubproject(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
```

- [ ] **Step 2: Create `app/admin/hq/clients/subproject-row.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  inputClass,
  labelClass,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
import {
  createSubproject,
  updateSubproject,
  deleteSubproject,
  type SubprojectInput,
} from "./actions";

export default function SubprojectRow({
  clientId,
  subproject,
  team,
  currency,
}: {
  clientId: string;
  subproject?: Subproject;
  team: TeamMember[];
  currency: string;
}) {
  const isNew = !subproject;
  const [name, setName] = useState(subproject?.name ?? "");
  const [description, setDescription] = useState(subproject?.description ?? "");
  const [accrued, setAccrued] = useState(subproject?.accrued_revenue ?? 0);
  const [collected, setCollected] = useState(subproject?.collected_revenue ?? 0);
  const [progress, setProgress] = useState(subproject?.progress ?? 0);
  const [contributorIds, setContributorIds] = useState<string[]>(
    subproject?.contributor_ids ?? []
  );
  const [sortOrder, setSortOrder] = useState(subproject?.sort_order ?? 0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): SubprojectInput => ({
    name,
    description,
    accrued_revenue: Number(accrued) || 0,
    collected_revenue: Number(collected) || 0,
    progress: Number(progress) || 0,
    contributor_ids: contributorIds,
    sort_order: Number(sortOrder) || 0,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createSubproject(clientId, build())
        : await updateSubproject(subproject!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setName("");
        setDescription("");
        setAccrued(0);
        setCollected(0);
        setProgress(0);
        setContributorIds([]);
        setSortOrder(0);
      }
    });
  };

  const remove = () => {
    if (!subproject) return;
    if (!window.confirm(`Delete sub-project "${subproject.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSubproject(subproject.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="border border-dark/10 rounded-xl p-4 bg-light/30">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>// sub-project name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Payments API" />
        </div>
        <div>
          <label className={labelClass}>// sort order</label>
          <input type="number" className={inputClass} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass}>// description</label>
        <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelClass}>{`// accrued revenue (${currency})`}</label>
          <input type="number" className={inputClass} value={accrued} onChange={(e) => setAccrued(Number(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>{`// collected revenue (${currency})`}</label>
          <input type="number" className={inputClass} value={collected} onChange={(e) => setCollected(Number(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>{`// progress: ${progress}%`}</label>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-coral" />
        </div>
      </div>

      <div className="mb-3">
        <ContributorPicker team={team} value={contributorIds} onChange={setContributorIds} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || name.trim() === ""}
          className="px-4 py-1.5 bg-dark text-white text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {pending ? "Saving..." : isNew ? "Add sub-project" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            delete
          </button>
        )}
        {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire sub-projects into `client-row.tsx`**

In `app/admin/hq/clients/client-row.tsx`, add the import near the other local imports:
```tsx
import SubprojectRow from "./subproject-row";
```

Replace the line `{/* SUBPROJECTS_SLOT — replaced in Task 6 */}` with:
```tsx
          {!isNew && (
            <div className="mb-5">
              <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">
                {`// sub-projects (${roll.count})`}
              </p>
              <div className="flex flex-col gap-3">
                {subprojects.map((sp) => (
                  <SubprojectRow
                    key={sp.id}
                    clientId={client!.id}
                    subproject={sp}
                    team={team}
                    currency={currency}
                  />
                ))}
                <SubprojectRow clientId={client!.id} team={team} currency={currency} />
              </div>
            </div>
          )}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual check (the data-flow guarantee)**

Open an existing client, add two sub-projects with accrued/collected/progress values. Save. The collapsed card's contract = sum of accrued, collected = sum of collected, outstanding = difference, and progress = revenue-weighted average — and the health dot recolors. Edit one sub-project's numbers and confirm the card totals change.

- [ ] **Step 6: Commit**

```bash
git add app/admin/hq/clients
git commit -m "feat(hq): sub-project CRUD with live rollup into client card"
```

---

### Task 7: Credentials editor (structured, masked, copyable)

**Files:**
- Create: `app/admin/hq/clients/credentials-editor.tsx`
- Modify: `app/admin/hq/clients/client-row.tsx` (replace `CREDENTIALS_SLOT`)

**Interfaces:**
- Consumes: `Credential`, `inputClass`, `labelClass`.
- Produces: `<CredentialsEditor value onChange />` (credentials persist as part of `updateClient`/`createClient`).

- [ ] **Step 1: Create `app/admin/hq/clients/credentials-editor.tsx`**

```tsx
"use client";

import { useState } from "react";
import { inputClass, labelClass, type Credential } from "@/lib/hq";

const empty: Credential = { label: "", username: "", secret: "", note: "" };

export default function CredentialsEditor({
  value,
  onChange,
}: {
  value: Credential[];
  onChange: (creds: Credential[]) => void;
}) {
  const [reveal, setReveal] = useState<Record<number, boolean>>({});

  const update = (i: number, patch: Partial<Credential>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="mb-5">
      <label className={labelClass}>// credentials</label>
      <div className="flex flex-col gap-2">
        {value.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
            <input className={inputClass} value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="label (e.g. Admin panel)" />
            <input className={inputClass} value={c.username} onChange={(e) => update(i, { username: e.target.value })} placeholder="username" />
            <div className="flex items-center gap-1">
              <input
                className={inputClass}
                type={reveal[i] ? "text" : "password"}
                value={c.secret}
                onChange={(e) => update(i, { secret: e.target.value })}
                placeholder="secret"
              />
              <button type="button" onClick={() => setReveal((r) => ({ ...r, [i]: !r[i] }))} className="font-mono text-[10px] text-muted hover:text-dark px-1" title="show/hide">
                {reveal[i] ? "hide" : "show"}
              </button>
              <button type="button" onClick={() => copy(c.secret)} className="font-mono text-[10px] text-muted hover:text-dark px-1" title="copy">
                copy
              </button>
            </div>
            <input className={inputClass} value={c.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="note" />
            <button type="button" onClick={() => remove(i)} className="font-mono text-[11px] text-red-600 hover:underline px-1">
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 font-mono text-[11px] text-coral hover:underline">
        + add credential
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `client-row.tsx`**

Add import:
```tsx
import CredentialsEditor from "./credentials-editor";
```

Replace `{/* CREDENTIALS_SLOT — replaced in Task 7 */}` with:
```tsx
          <CredentialsEditor value={credentials} onChange={setCredentials} />
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check**

On a client, add two credentials, toggle show/hide, click copy (verify clipboard), remove one, save. Refresh — the saved credentials reload, secrets masked by default.

- [ ] **Step 5: Commit**

```bash
git add app/admin/hq/clients
git commit -m "feat(hq): structured credentials editor with mask + copy"
```

---

### Task 8: NDA / Contract PDFs (private bucket + signed-URL view)

**Files:**
- Modify: `app/admin/hq/clients/actions.ts` (add doc actions)
- Create: `app/admin/hq/clients/doc-manager.tsx`
- Modify: `app/admin/hq/clients/client-row.tsx` (replace `PDF_SLOT`)

**Interfaces:**
- Consumes: `requireAdmin`, `revalidateHq`, `Result`.
- Produces: `uploadClientDoc(FormData)` (fields: `clientId`, `kind`, `file`), `getClientDocUrl(clientId, kind)` → `{ok, url?}`, `removeClientDoc(clientId, kind)`.

- [ ] **Step 1: Append doc actions to `app/admin/hq/clients/actions.ts`**

```ts
const DOC_BUCKET = "client-docs";
const DOC_KINDS = ["nda", "contract"] as const;
type DocKind = (typeof DOC_KINDS)[number];
const DOC_COL: Record<DocKind, "nda_path" | "contract_path"> = {
  nda: "nda_path",
  contract: "contract_path",
};

export async function uploadClientDoc(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const clientId = String(formData.get("clientId") || "");
  const kind = String(formData.get("kind") || "") as DocKind;
  const file = formData.get("file");

  if (!clientId) return { ok: false, error: "missing client" };
  if (!DOC_KINDS.includes(kind)) return { ok: false, error: "invalid kind" };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no file provided" };
  if (file.type !== "application/pdf") return { ok: false, error: "file must be a PDF" };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "PDF must be under 10MB" };

  const admin = createAdminClient();
  const path = `${clientId}/${kind}-${Date.now()}.pdf`;
  const { error: upErr } = await admin.storage
    .from(DOC_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const col = DOC_COL[kind];
  const { data: existing } = await admin.from("clients").select(col).eq("id", clientId).single();
  const oldPath = existing ? (existing as Record<string, string | null>)[col] : null;

  const { error: updErr } = await admin.from("clients").update({ [col]: path }).eq("id", clientId);
  if (updErr) return { ok: false, error: updErr.message };
  if (oldPath && oldPath !== path) await admin.storage.from(DOC_BUCKET).remove([oldPath]);

  revalidateHq();
  return { ok: true };
}

export async function getClientDocUrl(
  clientId: string,
  kind: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!DOC_KINDS.includes(kind as DocKind)) return { ok: false, error: "invalid kind" };

  const admin = createAdminClient();
  const col = DOC_COL[kind as DocKind];
  const { data: client } = await admin.from("clients").select(col).eq("id", clientId).single();
  const path = client ? (client as Record<string, string | null>)[col] : null;
  if (!path) return { ok: false, error: "no document" };

  const { data, error } = await admin.storage.from(DOC_BUCKET).createSignedUrl(path, 60);
  if (error || !data) return { ok: false, error: error?.message || "could not sign url" };
  return { ok: true, url: data.signedUrl };
}

export async function removeClientDoc(clientId: string, kind: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!DOC_KINDS.includes(kind as DocKind)) return { ok: false, error: "invalid kind" };

  const admin = createAdminClient();
  const col = DOC_COL[kind as DocKind];
  const { data: client } = await admin.from("clients").select(col).eq("id", clientId).single();
  const path = client ? (client as Record<string, string | null>)[col] : null;
  if (path) await admin.storage.from(DOC_BUCKET).remove([path]);

  const { error } = await admin.from("clients").update({ [col]: null }).eq("id", clientId);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
```

- [ ] **Step 2: Create `app/admin/hq/clients/doc-manager.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { labelClass } from "@/lib/hq";
import { uploadClientDoc, getClientDocUrl, removeClientDoc } from "./actions";

function DocSlot({
  clientId,
  kind,
  label,
  hasDoc,
}: {
  clientId: string;
  kind: "nda" | "contract";
  label: string;
  hasDoc: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setError("");
    setBusy(true);
    const fd = new FormData();
    fd.append("clientId", clientId);
    fd.append("kind", kind);
    fd.append("file", file);
    const res = await uploadClientDoc(fd);
    setBusy(false);
    if (!res.ok) setError(res.error || "upload failed");
    if (fileRef.current) fileRef.current.value = "";
  };

  const view = async () => {
    setError("");
    const res = await getClientDocUrl(clientId, kind);
    if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    else setError(res.error || "could not open");
  };

  const remove = async () => {
    if (!window.confirm(`Remove the ${label}?`)) return;
    setError("");
    setBusy(true);
    const res = await removeClientDoc(clientId, kind);
    setBusy(false);
    if (!res.ok) setError(res.error || "remove failed");
  };

  return (
    <div>
      <label className={labelClass}>{`// ${label}`}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {hasDoc && (
          <>
            <button type="button" onClick={view} className="font-mono text-[11px] text-coral hover:underline">
              view (signed)
            </button>
            <button type="button" onClick={remove} disabled={busy} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
              remove
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="font-mono text-xs text-muted"
        />
        {busy && <span className="font-mono text-[11px] text-muted">// working…</span>}
        {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
      </div>
    </div>
  );
}

export default function DocManager({
  clientId,
  hasNda,
  hasContract,
}: {
  clientId: string;
  hasNda: boolean;
  hasContract: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
      <DocSlot clientId={clientId} kind="nda" label="NDA (PDF)" hasDoc={hasNda} />
      <DocSlot clientId={clientId} kind="contract" label="Contract (PDF)" hasDoc={hasContract} />
    </div>
  );
}
```

- [ ] **Step 3: Wire into `client-row.tsx`**

Add import:
```tsx
import DocManager from "./doc-manager";
```

Replace `{/* PDF_SLOT — replaced in Task 8 */}` with:
```tsx
          {!isNew && (
            <DocManager
              clientId={client!.id}
              hasNda={Boolean(client!.nda_path)}
              hasContract={Boolean(client!.contract_path)}
            />
          )}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual check (security-critical)**

Upload a PDF as the NDA on a client. Click "view (signed)" — it opens in a new tab. Copy that signed URL, wait ~70s, reload — it should 403 (expired). Try the raw public object URL (`<SUPABASE_URL>/storage/v1/object/public/client-docs/<path>`) — it must 400/403 (bucket is private). Replace the NDA with a new PDF and confirm the old object is gone. Uploading a non-PDF is rejected.

- [ ] **Step 6: Commit**

```bash
git add app/admin/hq/clients
git commit -m "feat(hq): NDA/contract PDFs in private bucket via signed URLs"
```

---

### Task 9: Finance tab (rollups by currency + petty cash + expenses)

**Files:**
- Create: `app/admin/hq/finance/actions.ts`
- Create: `app/admin/hq/finance/petty-cash-row.tsx`
- Create: `app/admin/hq/finance/expense-row.tsx`
- Modify: `app/admin/hq/finance/page.tsx`

**Interfaces:**
- Consumes: `requireAdmin`, `revalidateHq`, `Result`; `CURRENCIES`, `EXPENSE_CATEGORIES`, `TeamMember`, `Client`, `Subproject`, `rollup`, `summarizeByCurrency`, `formatMoney`, `inputClass`, `labelClass`.
- Produces: `createPettyCash/updatePettyCash/deletePettyCash`, `createExpense/updateExpense/deleteExpense`, types `PettyCashInput`, `ExpenseInput`.

- [ ] **Step 1: Create `app/admin/hq/finance/actions.ts`**

```ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/hq";

function safeCurrency(c: string) {
  return CURRENCIES.includes(c as (typeof CURRENCIES)[number]) ? c : "INR";
}

export type PettyCashInput = {
  paid_by_id: string;
  purpose: string;
  amount: number;
  currency: string;
  spent_on: string;
};

function pettyPayload(input: PettyCashInput) {
  return {
    paid_by_id: input.paid_by_id || null,
    purpose: input.purpose.trim(),
    amount: Number.isFinite(input.amount) ? input.amount : 0,
    currency: safeCurrency(input.currency),
    spent_on: input.spent_on,
  };
}

export async function createPettyCash(input: PettyCashInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = pettyPayload(input);
  if (!payload.purpose) return { ok: false, error: "purpose is required" };
  if (!payload.spent_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updatePettyCash(id: string, input: PettyCashInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = pettyPayload(input);
  if (!payload.purpose) return { ok: false, error: "purpose is required" };
  if (!payload.spent_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deletePettyCash(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export type ExpenseInput = {
  category: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  incurred_on: string;
  recurring: boolean;
  recurring_period: string;
};

function expensePayload(input: ExpenseInput) {
  return {
    category: EXPENSE_CATEGORIES.includes(
      input.category as (typeof EXPENSE_CATEGORIES)[number]
    )
      ? input.category
      : "misc",
    vendor: (input.vendor || "").trim() || null,
    description: (input.description || "").trim() || null,
    amount: Number.isFinite(input.amount) ? input.amount : 0,
    currency: safeCurrency(input.currency),
    incurred_on: input.incurred_on,
    recurring: Boolean(input.recurring),
    recurring_period: input.recurring ? input.recurring_period || "monthly" : null,
  };
}

export async function createExpense(input: ExpenseInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = expensePayload(input);
  if (!payload.incurred_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = expensePayload(input);
  if (!payload.incurred_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
```

- [ ] **Step 2: Create `app/admin/hq/finance/petty-cash-row.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { CURRENCIES, inputClass, type TeamMember } from "@/lib/hq";
import {
  createPettyCash,
  updatePettyCash,
  deletePettyCash,
  type PettyCashInput,
} from "./actions";

export type PettyCash = {
  id: string;
  paid_by_id: string | null;
  purpose: string;
  amount: number;
  currency: string;
  spent_on: string;
};

export default function PettyCashRow({
  entry,
  team,
}: {
  entry?: PettyCash;
  team: TeamMember[];
}) {
  const isNew = !entry;
  const [paidById, setPaidById] = useState(entry?.paid_by_id ?? "");
  const [purpose, setPurpose] = useState(entry?.purpose ?? "");
  const [amount, setAmount] = useState(entry?.amount ?? 0);
  const [currency, setCurrency] = useState(entry?.currency ?? "INR");
  const [spentOn, setSpentOn] = useState(entry?.spent_on ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): PettyCashInput => ({
    paid_by_id: paidById,
    purpose,
    amount: Number(amount) || 0,
    currency,
    spent_on: spentOn,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createPettyCash(build())
        : await updatePettyCash(entry!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setPaidById("");
        setPurpose("");
        setAmount(0);
        setCurrency("INR");
        setSpentOn("");
      }
    });
  };

  const remove = () => {
    if (!entry) return;
    if (!window.confirm("Delete this petty-cash entry?")) return;
    startTransition(async () => {
      const res = await deletePettyCash(entry.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_1fr_0.8fr_1fr_auto] gap-2 items-center">
      <select className={inputClass} value={paidById} onChange={(e) => setPaidById(e.target.value)}>
        <option value="">who paid…</option>
        {team.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="for what" />
      <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="amount" />
      <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" className={inputClass} value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={pending || !purpose.trim() || !spentOn}
          className="px-3 py-1.5 bg-dark text-white text-xs rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {isNew ? "Add" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            ×
          </button>
        )}
      </div>
      {error && <span className="font-mono text-[11px] text-red-600 col-span-full">{`// ${error}`}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Create `app/admin/hq/finance/expense-row.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import { CURRENCIES, EXPENSE_CATEGORIES, inputClass } from "@/lib/hq";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  type ExpenseInput,
} from "./actions";

export type Expense = {
  id: string;
  category: string;
  vendor: string | null;
  description: string | null;
  amount: number;
  currency: string;
  incurred_on: string;
  recurring: boolean;
  recurring_period: string | null;
};

export default function ExpenseRow({ expense }: { expense?: Expense }) {
  const isNew = !expense;
  const [category, setCategory] = useState(expense?.category ?? "misc");
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? 0);
  const [currency, setCurrency] = useState(expense?.currency ?? "INR");
  const [incurredOn, setIncurredOn] = useState(expense?.incurred_on ?? "");
  const [recurring, setRecurring] = useState(expense?.recurring ?? false);
  const [recurringPeriod, setRecurringPeriod] = useState(expense?.recurring_period ?? "monthly");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): ExpenseInput => ({
    category,
    vendor,
    description,
    amount: Number(amount) || 0,
    currency,
    incurred_on: incurredOn,
    recurring,
    recurring_period: recurringPeriod,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createExpense(build())
        : await updateExpense(expense!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setCategory("misc");
        setVendor("");
        setDescription("");
        setAmount(0);
        setCurrency("INR");
        setIncurredOn("");
        setRecurring(false);
        setRecurringPeriod("monthly");
      }
    });
  };

  const remove = () => {
    if (!expense) return;
    if (!window.confirm("Delete this expense?")) return;
    startTransition(async () => {
      const res = await deleteExpense(expense.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1.2fr_0.8fr_0.7fr_1fr_auto] gap-2 items-center">
      <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input className={inputClass} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="vendor" />
      <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="description" />
      <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="amount" />
      <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" className={inputClass} value={incurredOn} onChange={(e) => setIncurredOn(e.target.value)} />
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 font-mono text-[10px] text-muted">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-coral" />
          rec.
        </label>
        {recurring && (
          <select className={`${inputClass} max-w-[90px]`} value={recurringPeriod} onChange={(e) => setRecurringPeriod(e.target.value)}>
            <option value="monthly">monthly</option>
            <option value="yearly">yearly</option>
          </select>
        )}
        <button
          onClick={save}
          disabled={pending || !incurredOn}
          className="px-3 py-1.5 bg-dark text-white text-xs rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {isNew ? "Add" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            ×
          </button>
        )}
      </div>
      {error && <span className="font-mono text-[11px] text-red-600 col-span-full">{`// ${error}`}</span>}
    </div>
  );
}
```

- [ ] **Step 4: Replace `app/admin/hq/finance/page.tsx`**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rollup,
  summarizeByCurrency,
  formatMoney,
  type Client,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import PettyCashRow, { type PettyCash } from "./petty-cash-row";
import ExpenseRow, { type Expense } from "./expense-row";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const admin = createAdminClient();
  const [{ data: clients }, { data: subs }, { data: petty }, { data: expenses }, { data: team }] =
    await Promise.all([
      admin.from("clients").select("*").eq("archived", false),
      admin.from("client_subprojects").select("*"),
      admin.from("petty_cash").select("*").order("spent_on", { ascending: false }),
      admin.from("company_expenses").select("*").order("incurred_on", { ascending: false }),
      admin.from("team_members").select("*").order("name", { ascending: true }),
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
            {clientList.map((c) => {
              const r = rollup(subsByClient.get(c.id) ?? []);
              return (
                <tr key={c.id} className="border-b border-dark/5 last:border-0">
                  <td className="p-3 text-dark">{c.name}</td>
                  <td className="p-3 text-right">{formatMoney(r.totalContract, c.currency)}</td>
                  <td className="p-3 text-right">{formatMoney(r.collected, c.currency)}</td>
                  <td className="p-3 text-right text-coral">{formatMoney(r.outstanding, c.currency)}</td>
                  <td className="p-3 text-right">{formatMoney(c.cost, c.currency)}</td>
                  <td className="p-3 text-right">{formatMoney(r.collected - Number(c.cost || 0), c.currency)}</td>
                </tr>
              );
            })}
            {clientList.length === 0 && (
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
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

On `/admin/hq/finance`: the per-currency totals and per-client table match the client cards. Add a petty-cash entry (who paid from the roster, purpose, amount, date) and a company expense — confirm both persist and that "Net (cash)" drops by those amounts for that currency.

- [ ] **Step 7: Commit**

```bash
git add app/admin/hq/finance
git commit -m "feat(hq): finance tab — currency rollups, petty cash, expenses"
```

---

### Task 10: Dashboard (home)

**Files:**
- Modify: `app/admin/hq/page.tsx`

**Interfaces:**
- Consumes: `rollup`, `healthColor`, `HEALTH_DOT`, `HEALTH_LABEL`, `summarizeByCurrency`, `formatMoney`, `Client`, `Subproject` from `@/lib/hq`.

- [ ] **Step 1: Replace `app/admin/hq/page.tsx`**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

`/admin/hq` shows KPI tiles per currency, correct counts, and a health board with off-track clients first. Numbers match the Clients and Finance tabs.

- [ ] **Step 4: Commit**

```bash
git add app/admin/hq/page.tsx
git commit -m "feat(hq): dashboard — KPIs by currency + client health board"
```

---

### Task 11: Discoverability link + final verification

**Files:**
- Modify: `app/admin/page.tsx` (add a link to `/admin/hq`)

**Interfaces:** none produced.

- [ ] **Step 1: Add an HQ link on the existing admin page**

In `app/admin/page.tsx`, inside the header `<section>` (after the `signed in as` `<p>` around line 105, before the `{/* Top-level view tabs */}` comment), insert:

```tsx
        <a
          href="/admin/hq"
          className="inline-block mb-6 px-4 py-2 rounded-full text-sm font-sans bg-coral text-white hover:bg-dark transition-colors"
        >
          → Client HQ (internal ops)
        </a>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Full walkthrough (end-to-end)**

With the schema applied in Supabase:
1. From `/admin`, click "→ Client HQ".
2. Add two team members.
3. Add a client (currency INR, cost, kickoff). Confirm grey dot / ₹0.
4. Add two sub-projects with accrued/collected/progress; assign contributors.
5. Confirm the client card contract = Σ accrued, collected = Σ collected, outstanding = difference, progress = revenue-weighted, dot recolors.
6. Add credentials (mask + copy). Upload an NDA PDF; view via signed URL; confirm the raw public URL 403s.
7. Finance: totals + per-client table match; add petty cash + an expense; Net drops.
8. Dashboard: KPIs, counts, and health board match.
9. Archive the client → gone from active/dashboard/finance; restore it.
10. Add a second client in USD → confirm totals group by currency (never summed together).

- [ ] **Step 4: Final typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat(hq): link to Client HQ from admin panel"
```

---

## Self-Review

**Spec coverage** (each spec section → task):
- §2 placement `/admin/hq` → Task 3. Credentials plaintext → Task 5/7. PDFs private+signed → Task 8. Per-client currency → Tasks 2/5. Health auto weighted → Task 2 (`rollup`). Contributors roster → Task 4 + picker (Task 5). Credentials structured → Task 7. Finance overview+petty+expenses → Task 9. Archive-on-remove → Task 5.
- §5 schema (all tables + view + bucket) → Task 1.
- §6 rollups + data-flow + health + profit + net + archive-exclusion → Task 2 helpers, consumed Tasks 5/6/9/10.
- §7 security (gate, service-role-only, signed URLs, masked creds) → Tasks 3/5/7/8.
- §8 server actions (every signature) → Tasks 4/5/6/8/9.
- §9 UI (clients column priority, dashboard, finance) → Tasks 5/9/10.
- §10 edge cases (0 sub-projects grey, accrued=0 fallback, mixed currency, member-delete scrub, archive exclusion, signed-URL expiry) → Task 2 (`rollup`/`healthColor`), Task 4 (`deleteTeamMember`), Task 8 (`getClientDocUrl`).
- §11 verification → each task's manual check + Task 11 walkthrough.
- §12 migration (schema + private bucket, no env changes) → Task 1.

**Placeholder scan:** The `CREDENTIALS_SLOT` / `SUBPROJECTS_SLOT` / `PDF_SLOT` comments in Task 5's `client-row.tsx` are intentional anchors, each explicitly replaced in Tasks 6–8 with the exact replacement text given. No `TBD`/`TODO`/"add error handling"-style gaps remain.

**Type consistency:** `ClientInput`, `SubprojectInput`, `TeamMemberInput`, `PettyCashInput`, `ExpenseInput`, `Credential`, `Client`, `Subproject`, `TeamMember`, `Rollup`, `CurrencyTotals` are defined once and imported everywhere. Action names (`createClient`/`updateClient`/`archiveClient`/`restoreClient`/`deleteClient`, `createSubproject`/`updateSubproject`/`deleteSubproject`, `uploadClientDoc`/`getClientDocUrl`/`removeClientDoc`, `create*/update*/delete*` petty/expense/team) match between their action file and each consuming component. `rollup()` returns `{totalContract, collected, outstanding, progress, count}` and every consumer reads those exact keys.
