-- Paid acquisition tables. Written only by server routes using the service
-- role; read by /hq/ads and the daily ads loop. RLS is on with no policies.

-- One row per lead: the /ai website form or a Meta Instant Form.
create table if not exists public.ad_leads (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  source         text not null check (source in ('website', 'instant_form')),
  event_id       text,
  meta_lead_id   text unique,
  name           text,
  email          text,
  company        text,
  phone          text,
  revenue_band   text,
  company_email  boolean not null default false,
  target_revenue boolean not null default false,
  variant        text,
  utm_source     text,
  utm_campaign   text,
  utm_content    text,
  ad_id          text,
  adset_id       text,
  campaign_id    text,
  form_id        text,
  from_ad        boolean not null default false,
  capi_ok        boolean,
  ip_hash        text,
  raw            jsonb
);

create index if not exists ad_leads_created_at_idx on public.ad_leads (created_at desc);
create index if not exists ad_leads_email_idx on public.ad_leads (email, created_at desc);
create index if not exists ad_leads_ip_hash_idx on public.ad_leads (ip_hash, created_at desc);

alter table public.ad_leads enable row level security;

-- One row per cal.com booking that reached the webhook. Email is hashed here;
-- the matching ad_leads row holds the contact details.
create table if not exists public.ad_bookings (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  booking_uid   text not null unique,
  event_id      text not null,
  lead_event_id text,
  email_hash    text,
  call_start    timestamptz,
  variant       text,
  utm_source    text,
  utm_campaign  text,
  utm_content   text,
  from_ad       boolean not null default false,
  capi_ok       boolean not null default false,
  capi_detail   jsonb
);

create index if not exists ad_bookings_created_at_idx on public.ad_bookings (created_at desc);

alter table public.ad_bookings enable row level security;
