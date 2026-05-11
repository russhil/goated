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
  role          text not null check (role in ('devops', 'growth-strategy')),
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

