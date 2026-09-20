import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isTargetRevenue, validateLead, type LeadInput } from "@/lib/ai/lead";
import { sendCapiEvents, type CapiResult } from "@/lib/meta/capi";
import { getPostHogClient } from "@/lib/posthog-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";

// /ai lead form submission. A valid company-email lead is the campaign's
// conversion: it fires the server-side Meta `Lead` event, deduplicated against
// the browser pixel by eventId.

export const runtime = "nodejs";

const HITS = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = HITS.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    HITS.set(ip, { count: 1, first: now });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

// Durable limits, checked against ad_leads so they hold across serverless
// instances (the in-memory map above only covers one warm instance).
const MAX_PER_IP_PER_HOUR = 3;

const hashIp = (ip: string) => createHash("sha256").update(`goated-ads:${ip}`).digest("hex");

async function priorLeads(ipHash: string, email: string) {
  try {
    const admin = createAdminClient();
    const hourAgo = new Date(Date.now() - WINDOW_MS).toISOString();
    const dayAgo = new Date(Date.now() - 24 * WINDOW_MS).toISOString();
    const [byIp, byEmail] = await Promise.all([
      admin.from("ad_leads").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
      admin.from("ad_leads").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
    ]);
    return { fromIp: byIp.count ?? 0, fromEmail: byEmail.count ?? 0 };
  } catch {
    // Fail open: a database outage must not block a real lead.
    return { fromIp: 0, fromEmail: 0 };
  }
}

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Every accepted lead is pushed to the HQ Telegram bot's allowed chats, so a
// lead reaches a person even if the database write fails.
async function notifyOwners(lines: string[]) {
  const ids = (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  await Promise.all(ids.map((id) => sendMessage(id, lines.join("\n"))));
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.slice(0, max) : "");

async function saveLead(row: Record<string, unknown>) {
  try {
    const { error } = await createAdminClient().from("ad_leads").insert(row);
    if (error) console.error("[ai-lead] insert failed", error.message);
    return !error;
  } catch (e) {
    console.error("[ai-lead] supabase unavailable", e instanceof Error ? e.message : "unknown");
    return false;
  }
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (rateLimited(ip || "unknown")) {
    return NextResponse.json(
      { ok: false, error: "Submission limit reached: retry in 1 hour." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  if (str(body.website, 200)) return NextResponse.json({ ok: true, eventId: "", ip: "" });

  const input: LeadInput = {
    name: str(body.name, 100),
    email: str(body.email, 200),
    company: str(body.company, 120),
    phone: str(body.phone, 30),
    revenueBand: str(body.revenueBand, 20),
  };
  const errors = validateLead(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  const email = input.email.trim().toLowerCase();
  const ipHash = hashIp(ip || "unknown");
  const prior = await priorLeads(ipHash, email);
  if (prior.fromIp >= MAX_PER_IP_PER_HOUR) {
    return NextResponse.json(
      { ok: false, error: "Submission limit reached: retry in 1 hour." },
      { status: 429 }
    );
  }

  const eventId = str(body.eventId, 80) || `lead-${crypto.randomUUID()}`;
  const variant = str(body.variant, 4) || null;
  const fbc = str(body.fbc, 300) || undefined;
  const utmSource = str(body.utm_source, 100) || null;
  const [firstName, ...rest] = input.name.trim().split(/\s+/);
  const targetRevenue = isTargetRevenue(input.revenueBand);

  // A repeat submission inside 24 hours goes on to the calendar but is not
  // counted as a second Lead.
  if (prior.fromEmail > 0) {
    return NextResponse.json({ ok: true, eventId, ip, repeat: true });
  }

  let capi: CapiResult;
  try {
    capi = await sendCapiEvents([
      {
        name: "Lead",
        eventId,
        sourceUrl: str(body.url, 500) || undefined,
        user: {
          email: input.email,
          phone: input.phone,
          firstName,
          lastName: rest.join(" ") || undefined,
          ip: ip || undefined,
          userAgent: request.headers.get("user-agent") ?? undefined,
          fbp: str(body.fbp, 120) || undefined,
          fbc,
          externalId: input.email,
        },
        customData: {
          content_name: "ai-lead-form",
          revenue_band: input.revenueBand,
          target_revenue: targetRevenue ? 1 : 0,
          ...(variant ? { variant } : {}),
        },
      },
    ]);
  } catch (e) {
    capi = { ok: false, skipped: false, status: 0, error: e instanceof Error ? e.message : "capi threw" };
  }
  if (!capi.ok && !capi.skipped) console.error("[ai-lead] capi failed", JSON.stringify(capi));

  const saved = await saveLead({
    source: "website",
    event_id: eventId,
    name: input.name.trim(),
    email,
    ip_hash: ipHash,
    company: input.company.trim(),
    phone: input.phone.trim(),
    revenue_band: input.revenueBand,
    company_email: true,
    target_revenue: targetRevenue,
    variant,
    utm_source: utmSource,
    utm_campaign: str(body.utm_campaign, 100) || null,
    utm_content: str(body.utm_content, 100) || null,
    from_ad: Boolean(fbc || utmSource),
    capi_ok: capi.ok,
  });

  await notifyOwners([
    "<b>New /ai lead</b>",
    `${escapeHtml(input.name.trim())} · ${escapeHtml(input.company.trim())}`,
    `${escapeHtml(email)} · ${escapeHtml(input.phone.trim())}`,
    `Revenue: ${escapeHtml(input.revenueBand)} · source: ${escapeHtml(utmSource ?? "direct")} · variant ${escapeHtml(variant ?? "a")}`,
    saved ? "Saved to ad_leads." : "NOT saved to ad_leads: check the table.",
  ]);

  try {
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: input.email.trim().toLowerCase(),
      event: "ai_lead_saved",
      properties: { variant, revenue_band: input.revenueBand, target_revenue: targetRevenue, saved },
    });
    await posthog.shutdown();
  } catch {
    // Analytics never blocks a lead.
  }

  return NextResponse.json({ ok: true, eventId, ip });
}
