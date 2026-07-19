-- ============================================================================
-- GOATED. Explore Jobs — Schema
--
-- Run this once in your Supabase SQL editor:
--   Dashboard → SQL Editor → New query → paste this → Run.
--
-- Re-running is safe: drops and recreates the policies cleanly.
-- ============================================================================

-- 1. Applications table
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          text not null,  -- job slug; jobs are dynamic (see public.jobs), so no enum check
  github_url    text,
  linkedin_url  text,
  instagram_url text,
  pitch         text,                              -- short blurb / project description
  status        text not null default 'submitted'
                check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  admin_notes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One application per user per role
create unique index if not exists applications_user_role_idx
  on public.applications (user_id, role);

create index if not exists applications_created_at_idx
  on public.applications (created_at desc);

-- Jobs are now dynamic (public.jobs). Drop the legacy role enum check so
-- applications can reference any current job slug. Safe to re-run.
alter table public.applications drop constraint if exists applications_role_check;

-- 2. updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- 3. Row-level security
alter table public.applications enable row level security;

-- Users see only their own
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

-- Users insert only as themselves
drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

-- Users can update their own GitHub/LinkedIn/Instagram/pitch (NOT status/admin_notes)
drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own"
  on public.applications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- (Admin operations bypass RLS using the service-role key from server actions.)

-- ============================================================================
-- 4. Rate limits
--
-- Server actions log a row here on each rate-limited operation
-- (currently `apply`). The check counts rows in a trailing window.
-- Service role only — clients never read or write this directly.
-- ============================================================================
create table if not exists public.rate_limits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  action      text not null,
  created_at  timestamptz not null default now()
);

create index if not exists rate_limits_user_action_time_idx
  on public.rate_limits (user_id, action, created_at desc);

alter table public.rate_limits enable row level security;
-- No policies — RLS is on, no SELECT/INSERT for any role except service_role.
-- Service-role bypasses RLS, so /lib/rate-limit.ts works on the server.

-- Optional: housekeeping. Run weekly in a scheduled job, or just live with
-- the table growing — it's tiny (one row per submission).
-- delete from public.rate_limits where created_at < now() - interval '30 days';

-- ============================================================================
-- 5. Contact form submissions
--
-- Captures every "Let's Build" form on the homepage. Inserted server-side
-- by /api/contact (which also forwards to Formspree for email).
-- Service role only — visitors never read this; the form fire-and-forgets
-- through an API route that uses the service-role key.
-- ============================================================================
create table if not exists public.contact_submissions (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  phone               text,
  message             text not null,
  status              text not null default 'new'
                      check (status in ('new', 'replied', 'archived')),
  admin_notes         text,
  forwarded_to_email  boolean not null default false,
  created_at          timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);

alter table public.contact_submissions enable row level security;
-- No policies — service role only.


-- ============================================================================
-- 6. Booking inquiries
--
-- The "Book a call" CTA on the homepage runs prospects through a one-question
-- qualifier ("what does your business do / what do you need help with") before
-- the Cal.com calendar loads. Each qualifier submission lands here so the team
-- can see who's about to book (and follow up on no-shows).
-- Inserted server-side by /api/booking-inquiry. Service role only.
-- ============================================================================
create table if not exists public.booking_inquiries (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  email                 text not null,
  business_description  text not null,
  status                text not null default 'pending'
                        check (status in ('pending', 'booked', 'no_show', 'archived')),
  admin_notes           text,
  booked_at             timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists booking_inquiries_created_at_idx
  on public.booking_inquiries (created_at desc);

create index if not exists booking_inquiries_status_idx
  on public.booking_inquiries (status);

alter table public.booking_inquiries enable row level security;
-- No policies — service role only.


-- ============================================================================
-- 7. Jobs (open roles)
--
-- Source of truth for /explore. Editable from the admin panel. Public visitors
-- read only published rows (RLS policy below); admin writes go through the
-- service-role client and bypass RLS.
-- `fields` is a JobField[] (see lib/jobs.ts) controlling the application form.
-- ============================================================================
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  tagline       text not null default '',
  description   text not null default '',
  task_heading  text not null default '',
  task_body     text not null default '',
  fields        jsonb not null default '[]'::jsonb,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists jobs_sort_idx on public.jobs (sort_order asc, created_at asc);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;

-- Anyone (anon included) may read published jobs.
drop policy if exists "jobs_select_published" on public.jobs;
create policy "jobs_select_published"
  on public.jobs for select
  using (published = true);
-- (Admin create/update/delete bypass RLS via the service-role key.)

-- Seed the two original hardcoded roles. Re-running is a no-op.
insert into public.jobs (slug, title, tagline, description, task_heading, task_body, fields, sort_order)
values
  (
    $$devops$$,
    $$DevOps Engineer$$,
    $$Ship infra that scales without drama.$$,
    $$We're looking for someone who's obsessed with making things deploy faster, monitor smarter, and never page at 3am. You'll own the pipelines and infra across our client builds and in-house products.$$,
    $$Show us your craziest project$$,
    $$Send us the most ambitious thing you've shipped. Could be a homegrown Kubernetes cluster, a CI/CD pipeline you obsessed over, a self-hosted observability stack — whatever you're proud of. Drop the GitHub repo and tell us what made it hard.$$,
    $$[
      {"key":"github_url","label":"GitHub link","placeholder":"https://github.com/yourname/your-craziest-project","type":"url","required":true},
      {"key":"linkedin_url","label":"LinkedIn","placeholder":"https://linkedin.com/in/yourname","type":"url","required":true},
      {"key":"pitch","label":"What made it hard? (optional)","placeholder":"30 seconds of context — the thing you're most proud of fixing.","type":"textarea","required":false}
    ]$$::jsonb,
    0
  ),
  (
    $$growth-strategy$$,
    $$Growth & Strategy$$,
    $$Turn audience into pipeline. Pipeline into revenue.$$,
    $$We're looking for someone with a sharp eye for narrative, distribution, and what makes people actually click. You'll work directly with the founders on positioning, content, and growth experiments across our brand and our clients.$$,
    $$Show us how you think$$,
    $$Drop your LinkedIn and Instagram so we can see what you've shipped publicly — content, campaigns, brand work, side projects, anything that shows your taste and your reach. If you've got a one-line pitch on what we should be doing differently, even better.$$,
    $$[
      {"key":"linkedin_url","label":"LinkedIn","placeholder":"https://linkedin.com/in/yourname","type":"url","required":true},
      {"key":"instagram_url","label":"Instagram","placeholder":"https://instagram.com/yourname","type":"url","required":true},
      {"key":"pitch","label":"One-liner: what should we be doing differently? (optional)","placeholder":"Be opinionated.","type":"textarea","required":false}
    ]$$::jsonb,
    1
  )
on conflict (slug) do nothing;


-- ============================================================================
-- 8. Case studies (portfolio)
--
-- Source of truth for /portfolio. Editable from the admin panel. Public
-- visitors read only published rows; admin writes bypass RLS via service role.
-- `image_url` is either a /public asset path (seeded rows) or a Supabase
-- Storage public URL (admin uploads).
-- ============================================================================
create table if not exists public.case_studies (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category      text not null check (category in ('client', 'ai', 'tools')),
  tags          text[] not null default '{}',
  status        text not null check (status in ('live', 'building')),
  title         text not null,
  subtitle      text not null default '',
  client        text not null default '',
  year          text not null default '',
  description   text not null default '',
  stat          text not null default '',
  problem       text not null default '',
  built         text not null default '',
  result        text not null default '',
  result_stat   text not null default '',
  image_url     text,
  link          text,
  published     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists case_studies_sort_idx on public.case_studies (sort_order asc, created_at asc);

drop trigger if exists case_studies_set_updated_at on public.case_studies;
create trigger case_studies_set_updated_at
  before update on public.case_studies
  for each row execute function public.set_updated_at();

alter table public.case_studies enable row level security;

drop policy if exists "case_studies_select_published" on public.case_studies;
create policy "case_studies_select_published"
  on public.case_studies for select
  using (published = true);

-- Seed the existing portfolio. Re-running is a no-op.
insert into public.case_studies
  (slug, category, tags, status, title, subtitle, client, year, description, stat, problem, built, result, result_stat, image_url, link, sort_order)
values
  ($$azadi$$, $$tools$$, array[$$MUSIC$$,$$CATALOGUE MANAGEMENT$$], $$live$$,
   $$Azadi Records$$, $$Music Catalogue System$$, $$Azadi Records, Mumbai$$, $$2024$$,
   $$We took 100+ spreadsheets across artists, royalties, splits and ISRC codes and collapsed them into one unified catalogue system. Now expanding to all labels on the roster including Seedhe Maut, with an artist-facing app in development.$$,
   $$100+ spreadsheets → 1 system$$,
   $$Azadi Records managed their entire catalogue — 32+ releases, multiple artists, complex royalty splits — across 100 disconnected spreadsheets. Every release meant hours of manual updates, and mistakes were inevitable.$$,
   $$A centralised catalogue management system with a live overview dashboard, ISRC tracking, automated split calculations, and a licensor management module. Built in React with a Supabase backend.$$,
   $$Onboarded in a single day. Expanding to every label on the Azadi roster. Artist-facing app in development.$$,
   $$100+ spreadsheets. One dashboard.$$, $$/AZR.png$$, null, 0),

  ($$movement$$, $$client$$, array[$$HEALTHCARE$$,$$BOOKING SYSTEM$$], $$live$$,
   $$Movement by Design$$, $$Clinic Booking & Patient Management$$, $$Movement by Design, South Bombay$$, $$2025$$,
   $$A custom booking and patient management system for a physiotherapy clinic in South Bombay. Replaces phone bookings and paper files entirely.$$,
   $$100% bookings automated$$,
   $$A busy physiotherapy practice in South Bombay was managing all appointments over WhatsApp and phone calls. No cancellation flow, no reminders, double-bookings were common, and patient history lived in paper files.$$,
   $$A custom booking system with online scheduling, automated WhatsApp reminders 24hrs before appointments, a patient history module with session notes, and an admin dashboard showing the week at a glance.$$,
   $$No-shows reduced by 60%. The practice runs its full schedule without a single phone call for bookings. Patient records are now searchable and persistent.$$,
   $$60% fewer no-shows.$$, $$/MBD.png$$, $$https://movementbydesign.in$$, 1),

  ($$psy-crm$$, $$tools$$, array[$$CREATIVE$$,$$CRM$$], $$live$$,
   $$PSY CRM$$, $$Tattoo Studio Client Management$$, $$PSY Tattoo Studio, Mumbai$$, $$2024$$,
   $$A bespoke CRM for a tattoo studio - manages client consultations, artist assignments, design references, and deposit collection in one system.$$,
   $$3hrs saved per day on admin$$,
   $$PSY Tattoo Studio was tracking client consultations through Instagram DMs, a shared Notes app, and verbal communication. Deposits were missed, reference images were lost, and no one knew which artist was assigned to which client.$$,
   $$A fully custom CRM with a client pipeline (lead → consultation → confirmed → completed), artist assignment, design reference uploads, deposit tracking, and automated appointment reminders.$$,
   $$Zero missed deposits since launch. Every artist knows exactly what they're working on. The studio runs 3 hours shorter admin days.$$,
   $$0 missed deposits since launch.$$, $$/PSY-CRM.png$$, null, 2),

  ($$parchi$$, $$ai$$, array[$$AI$$,$$PRODUCTIVITY$$], $$building$$,
   $$Parchi AI$$, $$AI-Powered Capture Tool$$, $$Parchi Technologies$$, $$2025$$,
   $$Parchi is a tool that automates clinic operations across India - appointments, records, billing, and patient communication in one place.$$,
   $$Captures 10x faster than manual notes$$,
   $$Important thoughts, tasks, and ideas disappear between the moment they occur and when you sit down to action them. Existing note apps require too much friction for fast capture.$$,
   $$A fast-capture AI tool where you drop any thought - voice or text - and Parchi automatically categorises it, extracts action items, sets reminders, and surfaces related items when context matches. Inspired by parchi.tech.$$,
   $$Currently in beta. Early users report capturing 3x more actionable tasks daily versus traditional note apps.$$,
   $$3x more tasks captured daily.$$, $$/PARCHI.png$$, $$https://www.parchi.tech$$, 3),

  ($$psy-shop$$, $$client$$, array[$$E-COMMERCE$$,$$WEB$$], $$live$$,
   $$PSY Website + Shop$$, $$Brand Site & Merch Storefront$$, $$PSY Tattoo Studio, Mumbai$$, $$2024$$,
   $$A full brand website and e-commerce storefront - merch ordering, artist portfolios, appointment booking, and a backend order management CRM.$$,
   $$50 merch orders in week 1$$,
   $$PSY Studio had no web presence beyond Instagram. Merch drops were managed through DMs, orders tracked in WhatsApp groups, and there was no way to browse artist portfolios or book online.$$,
   $$A complete brand website with artist portfolio pages, an e-commerce store for merch drops with inventory management, integrated booking flow, and a backend order management system.$$,
   $$Launched to 50 merch orders in the first week. Booking requests increased 3x from organic web traffic. The studio team manages all orders from one dashboard.$$,
   $$3x booking increase from web traffic.$$, $$/PSY-WEB.png$$, $$https://psy-website-kappa.vercel.app/studio$$, 4),

  ($$wwp$$, $$client$$, array[$$FASHION$$,$$E-COMMERCE$$], $$live$$,
   $$Wear World Peace$$, $$E-Commerce & Operations$$, $$Wear World Peace$$, $$2025$$,
   $$Built the full e-commerce infrastructure for Wear World Peace - the clothing brand founded by NBA player Ron Artest (Metta World Peace). A complete online store with shipping, operations, order management, and remarketing.$$,
   $$From zero web presence to full storefront$$,
   $$Wear World Peace - the clothing brand founded by NBA champion Ron Artest - had built strong demand through Instagram but didn't have a dedicated website. The brand needed a proper online home to showcase collections, handle orders at scale, and support their growing customer base.$$,
   $$A fully functional e-commerce website with product catalogue, collections, cart and checkout. On top of the storefront, we set up shipping logistics, order management, inventory tracking, and remarketing flows to drive repeat purchases.$$,
   $$The brand now has a complete online storefront and a fully operational backend. Orders flow seamlessly from checkout to delivery, remarketing brings customers back, and the team manages everything from one dashboard.$$,
   $$Zero to fully operational e-commerce.$$, $$/wear-world-peace.png$$, $$https://www.wearworldpeace.com/$$, 5),

  ($$zenspace$$, $$client$$, array[$$CREATIVE$$,$$BRAND SITE$$], $$live$$,
   $$Zenspace$$, $$Tattoo Studio Brand Site$$, $$Zenspace Tattoo Studio$$, $$2025$$,
   $$A complete brand site for Zenspace — categories, artist directory, piercing services, and a streamlined "Book consultation" flow. Built to convert browsers into bookings.$$,
   $$Brand site → consultation pipeline$$,
   $$Zenspace was sending prospective clients to Instagram. With no website, every consultation request was a manual DM thread, artist portfolios were scattered, and there was no way to filter by style or artist before reaching out.$$,
   $$A full brand website with category-based navigation (tattoos, piercing, custom), artist directory with portfolios, and a single "Book consultation" CTA wired to WhatsApp. Soft purple gradient design, smooth navigation, mobile-first.$$,
   $$Consultation requests now arrive pre-qualified — clients pick their artist and style before messaging. The Instagram-only era is over.$$,
   $$Pre-qualified consults from day one.$$, $$/zenspace.png$$, null, 6),

  ($$inkdesk$$, $$tools$$, array[$$CREATIVE$$,$$CRM$$,$$TATTOO$$], $$live$$,
   $$InkDesk$$, $$Tattoo Studio Operating System$$, $$GOATED. (in-house product)$$, $$2025$$,
   $$A purpose-built CRM for tattoo studios — orders, customers, artists, expenses, campaigns and finance in one operating system. Built from learnings on PSY CRM and being rolled out as a productized offering.$$,
   $$One dashboard for the whole studio$$,
   $$Tattoo studios juggle artist payouts, deposit tracking, customer source attribution, and expense logging across spreadsheets and notes. Existing CRMs are built for sales teams, not artists. Studios needed a single tool built for how they actually work.$$,
   $$A dashboard-first studio operating system: System Overview with revenue/orders/customers/avg-order metrics, recent orders feed, top artists leaderboard with payout splits, customer source breakdown (Instagram, referral, walk-in), expense logging, and a campaigns module. Multi-tenant from day one.$$,
   $$Live at inkdesk.goatedd.tech. Onboarding studios now — replacing the spreadsheet chaos with a clean, opinionated workflow.$$,
   $$Spreadsheets → operating system.$$, $$/inkdesk.png$$, $$https://inkdesk.goatedd.tech/dashboard$$, 7)
on conflict (slug) do nothing;


-- ============================================================================
-- 9. Storage bucket for case-study images
--
-- Public bucket: objects are served via their public URL (read needs no
-- policy). Admin uploads go through the service-role client, which bypasses
-- storage RLS, so no storage.objects policies are required.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('case-studies', 'case-studies', true)
on conflict (id) do nothing;


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



-- ============================================================================
-- 11. Internal Ops — round 3 additions
--   - sub-project due dates (auto progress + off-track flagging)
--   - prospects pipeline (kanban / list)
--   - Splitwise-style petty cash (payer + settlements)
-- Idempotent; re-running is safe.
-- ============================================================================

-- 11.1 Sub-project due date (drives off-track flag)
alter table public.client_subprojects
  add column if not exists due_date date;

-- 11.2 Prospects pipeline
create table if not exists public.prospects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  company       text,
  email         text,
  phone         text,
  source        text,
  stage         text not null default 'new'
                check (stage in ('new','contacted','qualified','proposal','won','lost')),
  est_value     numeric(14,2) not null default 0,
  currency      text not null default 'INR',
  notes         text,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists prospects_stage_idx on public.prospects (stage, sort_order asc, created_at desc);

drop trigger if exists prospects_set_updated_at on public.prospects;
create trigger prospects_set_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

alter table public.prospects enable row level security;
-- No policies — service role only.

-- 11.3 Splitwise-style petty cash: which partner paid (Vansh / Russhil).
-- Every expense is split 50/50 between the two; balance derives from who paid.
alter table public.petty_cash
  add column if not exists payer text;

-- 11.4 Settlements (one partner paying the other to zero the balance)
create table if not exists public.petty_cash_settlements (
  id            uuid primary key default gen_random_uuid(),
  from_person   text not null,   -- who paid
  to_person     text not null,   -- who received
  amount        numeric(14,2) not null,
  currency      text not null default 'INR',
  settled_on    date not null,
  created_at    timestamptz not null default now()
);

create index if not exists petty_cash_settlements_date_idx on public.petty_cash_settlements (settled_on desc);

alter table public.petty_cash_settlements enable row level security;
-- No policies — service role only.


-- ============================================================================
-- 12. Sub-project dated payments + phases
--   payments: [{date, amount}] — collected_revenue is kept as their sum (set on
--   save); revenue-vs-time plots each payment on its own date.
--   phases:   [{name, date}] — dated milestones (shown on the sub-project and as
--   markers on the revenue chart).
-- Idempotent.
-- ============================================================================
alter table public.client_subprojects
  add column if not exists payments jsonb not null default '[]'::jsonb;
alter table public.client_subprojects
  add column if not exists phases jsonb not null default '[]'::jsonb;

-- One-time backfill: existing collected_revenue becomes a single dated payment
-- (dated by due_date, else the row's creation date) so nothing is lost. Only
-- touches rows that have collected money but no payments yet — safe to re-run.
update public.client_subprojects
set payments = jsonb_build_array(
  jsonb_build_object(
    'date', to_char(coalesce(due_date, created_at::date), 'YYYY-MM-DD'),
    'amount', collected_revenue
  )
)
where collected_revenue > 0
  and (payments is null or jsonb_array_length(payments) = 0);
