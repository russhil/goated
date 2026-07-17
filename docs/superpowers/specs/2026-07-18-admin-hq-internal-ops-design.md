# Internal Ops (Admin HQ) — Design

**Date:** 2026-07-18
**Status:** Approved for planning
**Author:** GOATED. team + Claude

## 1. Purpose

An internal, admin-only system for tracking clients, their project progress, and
company finances. It is a private back-office CRM — not visible to any public or
authenticated non-admin user. Three areas: a **Dashboard** (home), a **Clients**
page (per-client project tracking), and a **Finance** page (company financials +
petty cash + expenses).

Core requirement: **data flows correctly** — money and progress edited at the
sub-project level roll up automatically to the client card, the dashboard, and
finance, with no duplicate storage that could drift.

## 2. Decisions (resolved)

| Decision | Choice |
| --- | --- |
| Placement | Dedicated section under `/admin` → `/admin/hq`, `/admin/hq/clients`, `/admin/hq/finance`. The existing `/admin` submission-review panel is untouched. |
| Access | Reuse `isAdmin()` allowlist + middleware session refresh. All reads/writes via `requireAdmin()` server actions. |
| Credential storage | Plaintext, in a service-role-only table, reachable only through admin-gated actions. UI masks with per-row reveal + copy. |
| PDF storage | Private `client-docs` bucket. Short-lived signed URLs generated server-side on view. Never public. |
| Currency | Per-client. Dashboard/finance group totals by currency (no FX conversion). |
| Health color | Auto-derived from a **revenue-weighted** average of sub-project progress. |
| Contributors | Managed roster (`team_members`); clients & sub-projects reference member ids. |
| Credentials shape | Structured list (jsonb): `{label, username, secret, note}` per entry. |
| Finance scope | Client rollups + petty cash ledger + general company-expenses ledger. |
| Remove client | Archive (soft): hidden from active views, data retained, restorable; hard-delete available behind an "Archived" filter. |

## 3. Non-goals (YAGNI)

- No FX conversion between currencies — totals are grouped per currency.
- No time tracking, invoicing, or payment-gateway integration.
- No per-person workload analytics beyond what the roster reference enables later.
- No approval workflows on money entry — direct admin edits.
- No audit log / change history in v1.

## 4. Routes & file layout

```
app/admin/hq/layout.tsx            Gate once (getUser + isAdmin → shared 403 UI); render sub-nav
app/admin/hq/page.tsx              Dashboard (home)
app/admin/hq/clients/page.tsx      Clients list
app/admin/hq/finance/page.tsx      Finance
app/admin/hq/clients/actions.ts    clients, sub-projects, credentials, PDF up/download, team roster
app/admin/hq/finance/actions.ts    petty cash, company expenses

app/admin/hq/clients/client-row.tsx         big client editor (collapse/expand card)
app/admin/hq/clients/subproject-row.tsx     sub-project editor nested in client card
app/admin/hq/clients/credentials-editor.tsx structured credential list widget
app/admin/hq/clients/team-manager.tsx       roster CRUD (section on Clients page)
app/admin/hq/finance/petty-cash-row.tsx
app/admin/hq/finance/expense-row.tsx

lib/hq.ts   money formatting per currency + health-color helper + weighted-progress helper
components/AdminGate reused/extracted 403 block (or inline in layout)
```

The `/admin/hq` layout checks admin once; all three pages inherit it. Server
actions follow the repo convention: start with `requireAdmin()`, end with the
relevant `revalidatePath()` calls (`/admin/hq`, `/admin/hq/clients`,
`/admin/hq/finance`).

## 5. Data model

All new tables: `enable row level security` with **zero policies** (service-role
only, same as `contact_submissions`). DDL is appended to `supabase/schema.sql`,
idempotent (`create table if not exists`), and run manually in the Supabase SQL
editor.

### 5.1 `team_members`
```
id uuid pk, name text not null, role text, email text,
active boolean not null default true, created_at timestamptz default now()
```

### 5.2 `clients`
```
id uuid pk,
name text not null,
industry text,
currency text not null default 'INR',      -- per-client (INR, USD, EUR, GBP, AED)
github_url text, db_url text, live_url text,
description text,                            -- overall description
story text,                                 -- progress narrative
cost numeric(14,2) not null default 0,      -- manual "cost of the project"
kickoff_date date,
credentials jsonb not null default '[]',    -- [{label, username, secret, note}]
nda_path text, contract_path text,          -- private-bucket object paths (nullable)
contributor_ids uuid[] not null default '{}',
archived boolean not null default false,
created_at timestamptz default now(), updated_at timestamptz default now()
```
**No** stored `total_contract`/`collected_revenue` — derived (see §6). `updated_at`
maintained by the existing `set_updated_at` trigger.

### 5.3 `client_subprojects`
```
id uuid pk,
client_id uuid not null references clients(id) on delete cascade,
name text not null,
description text,
accrued_revenue numeric(14,2) not null default 0,   -- this sub-project's contract value
collected_revenue numeric(14,2) not null default 0,
progress int not null default 0 check (progress between 0 and 100),
contributor_ids uuid[] not null default '{}',
sort_order int not null default 0,
created_at timestamptz default now(), updated_at timestamptz default now()
```

### 5.4 `petty_cash`
```
id uuid pk,
paid_by_id uuid references team_members(id) on delete set null,   -- who paid
purpose text not null,                                             -- for what
amount numeric(14,2) not null,
currency text not null default 'INR',
spent_on date not null,
created_at timestamptz default now()
```

### 5.5 `company_expenses`
```
id uuid pk,
category text not null default 'misc',      -- rent, salaries, subscriptions, misc, ...
vendor text,
description text,
amount numeric(14,2) not null,
currency text not null default 'INR',
incurred_on date not null,
recurring boolean not null default false,
recurring_period text,                      -- 'monthly' | 'yearly' | null
created_at timestamptz default now()
```

### 5.6 View `client_financials`
```sql
create or replace view public.client_financials as
select
  c.id as client_id,
  coalesce(sum(sp.accrued_revenue), 0)                         as total_contract,
  coalesce(sum(sp.collected_revenue), 0)                       as collected_revenue,
  coalesce(sum(sp.accrued_revenue), 0)
    - coalesce(sum(sp.collected_revenue), 0)                   as outstanding,
  -- revenue-weighted progress; fall back to simple avg when all accrued = 0
  case
    when coalesce(sum(sp.accrued_revenue), 0) > 0
      then sum(sp.progress * sp.accrued_revenue) / sum(sp.accrued_revenue)
    else coalesce(avg(sp.progress), 0)
  end                                                          as avg_progress,
  count(sp.id)                                                 as subproject_count
from public.clients c
left join public.client_subprojects sp on sp.client_id = c.id
group by c.id;
```
The view is read by the service-role client only. (If the view inherits caller
privileges awkwardly, the same aggregation is computed in the query layer as a
fallback — behaviour is identical.)

### 5.7 Storage bucket
```
client-docs — PRIVATE. Object paths: {client_id}/nda-{ts}.pdf, {client_id}/contract-{ts}.pdf
```
No storage policies; service-role uploads and generates signed URLs (TTL ~60s).

## 6. Rollups & the data-flow guarantee

- `client_financials` is the single source of truth for client totals. `clients`
  never stores contract/collected, so there is nothing to keep in sync.
- Editing a sub-project's `accrued_revenue` / `collected_revenue` / `progress`,
  then `revalidatePath` on the three HQ routes, updates the client card, the
  dashboard KPIs, and the finance table on the next render — automatically.
- **Health color** from `avg_progress`: `≥80` green, `40–79` amber, `<40` red,
  `subproject_count = 0` grey/neutral.
- **Per-client profit:** contracted = `total_contract − cost`; cash = `collected − cost`.
- **Company net (cash basis), per currency:**
  `Σ collected − Σ cost − Σ petty_cash − Σ company_expenses`.
- Archived clients are excluded from all active views, dashboard counts, and
  totals.

## 7. Security model

- `/admin/hq/layout.tsx` calls `supabase.auth.getUser()`; non-admins get the same
  403 block used by `/admin`. Middleware refreshes the session cookie as today.
- Every mutation is a server action beginning with `requireAdmin()`; the browser
  never queries these tables directly. Tables are service-role-only (RLS on, zero
  policies), matching `contact_submissions` / `booking_inquiries`.
- PDFs: upload action validates `application/pdf` + size cap (~10MB), stores in the
  private bucket. A `getClientDocUrl(clientId, kind)` action returns a short-lived
  signed URL, generated only after `requireAdmin()`.
- Credentials are plaintext per decision, but only decryptable-in-practice by
  reaching an admin action; UI masks secrets with reveal + copy. (Trade-off noted:
  visible to anyone with Supabase DB access.)

## 8. Server actions (signatures)

`clients/actions.ts`
```
createClient / updateClient(id, ClientInput) / archiveClient(id) / restoreClient(id) / deleteClient(id)
createSubproject / updateSubproject(id, SubprojectInput) / deleteSubproject(id)
uploadClientDoc(formData)  → { path }         // kind: 'nda' | 'contract'
getClientDocUrl(clientId, kind)  → { url }    // signed, short TTL
createTeamMember / updateTeamMember(id, ...) / deleteTeamMember(id)  // scrubs contributor_ids
```
`finance/actions.ts`
```
createPettyCash / updatePettyCash(id, ...) / deletePettyCash(id)
createExpense / updateExpense(id, ...) / deleteExpense(id)
```
All validate inputs, gate with `requireAdmin()`, and `revalidatePath` the HQ routes.

## 9. UI

### 9.1 Clients — column priority

List of client cards. **Collapsed** shows only high-signal columns left→right by
priority; **expand** reveals the full record + sub-projects.

```
COLLAPSED (priority order):
 ● Acme Corp   Fintech   ₹12,00,000   ₹7,50,000   ₹4,50,000   68%   12 Jan
 health name   industry  contract     collected   outstanding  prog  kickoff
   ● ≥80 green · 40–79 amber · <40 red · no sub-projects grey

EXPANDED adds:
 Description · Story
 Cost · Contracted profit (contract−cost) · Cash profit (collected−cost)
 Links: GitHub · DB · Live      Contributors: chips from roster
 Credentials: [label | user | •••••• | copy]   NDA ▸view   Contract ▸view (signed)
 Sub-projects: name · progress bar · accrued · collected · contributors  [+ add]
```
Money renders in the client's own currency. Contract/collected/outstanding/
progress are all derived. A **Team roster** manager section and an **Archived**
filter live on this page.

### 9.2 Dashboard (home)

- KPI tiles **grouped by currency**: contract, collected, outstanding, project
  cost, **Net (cash basis)**.
- Counts: active clients, sub-projects, off-track count.
- **Health board**: clients sorted worst-health-first with progress + outstanding.

### 9.3 Finance

- Totals by currency: contract / collected / outstanding / cost / net.
- Per-client financial table (the rollup).
- **Petty cash ledger**: who paid · purpose · date · amount — inline add/edit/delete.
- **Company expenses ledger**: category · vendor · amount · date · recurring —
  folded into net.

## 10. Edge cases

- Client with zero sub-projects → contract/collected/outstanding = 0, health grey.
- All sub-projects `accrued = 0` → weighted progress falls back to simple average.
- Mixed currencies → never summed across currencies; grouped subtotals only.
- Deleting a team member → their id scrubbed from all `contributor_ids`;
  `petty_cash.paid_by_id` set null (shows "—").
- Archived client → excluded from every active list, count, and total.
- Signed URL expiry → view action re-issues a fresh URL on each click.

## 11. Verification

- `npx tsc --noEmit` clean.
- Dev server walkthrough: create team member → client → two sub-projects; confirm
  client card total = Σ sub-projects and dashboard/finance totals match; edit a
  sub-project and confirm the rollup changes everywhere.
- Upload a PDF; confirm it is reachable only via signed URL (raw storage URL 403s).
- Add petty-cash + expense rows; confirm Net updates.
- Archive a client; confirm it leaves active views/totals and can be restored.

## 12. Migration / rollout

- Append all DDL to `supabase/schema.sql` (idempotent) and run in the SQL editor.
- Create the private `client-docs` bucket via the same SQL (`storage.buckets`
  insert with `public = false`).
- No env changes required (reuses existing Supabase + admin allowlist config).
