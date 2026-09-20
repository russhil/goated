import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { extractLead, verifyCalSignature, type CalBookingPayload } from "@/lib/cal/webhook";
import { sendCapiEvents, type CapiResult } from "@/lib/meta/capi";
import { createAdminClient } from "@/lib/supabase/admin";

// cal.com booking webhook. The form fill is the campaign's `Lead`; a confirmed
// booking is the deeper `Schedule` event, sent server-side from here.

export const runtime = "nodejs";

const SITE = "https://goatedd.tech";

async function recordConversion(row: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("ad_bookings")
      .upsert(row, { onConflict: "booking_uid" });
    if (error) console.error("[cal] ad_bookings upsert failed", error.message);
  } catch (e) {
    console.error("[cal] ad_bookings unavailable", e instanceof Error ? e.message : "unknown");
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (!verifyCalSignature(raw, request.headers.get("x-cal-signature-256"), secret)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let body: { triggerEvent?: string; payload?: CalBookingPayload };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  if (body.triggerEvent !== "BOOKING_CREATED") {
    return NextResponse.json({ ok: true, ignored: body.triggerEvent ?? "unknown" });
  }

  const lead = body.payload ? extractLead(body.payload) : null;
  if (!lead) {
    return NextResponse.json({ ok: false, error: "no booking uid" }, { status: 400 });
  }

  // Same id the browser pixel used, so Meta merges the two Schedule events.
  const eventId = lead.meta.schedule_event_id || `cal-${lead.uid}`;

  let capi: CapiResult;
  try {
    capi = await sendCapiEvents([
      {
        name: "Schedule",
        eventId,
        sourceUrl: lead.meta.page || `${SITE}/ai`,
        user: {
          email: lead.email,
          phone: lead.phone,
          firstName: lead.firstName,
          lastName: lead.lastName,
          ip: lead.meta.ip,
          userAgent: lead.meta.ua,
          fbp: lead.meta.fbp,
          fbc: lead.meta.fbc,
          externalId: lead.email,
        },
        customData: {
          content_name: "free-30-minute-call",
          ...(lead.meta.variant ? { variant: lead.meta.variant } : {}),
        },
      },
    ]);
  } catch (e) {
    capi = {
      ok: false,
      skipped: false,
      status: 0,
      error: e instanceof Error ? e.message : "capi threw",
    };
  }

  if (!capi.ok) console.error("[cal] schedule capi not delivered", JSON.stringify(capi));

  await recordConversion({
    booking_uid: lead.uid,
    event_id: eventId,
    lead_event_id: lead.meta.lead_event_id ?? null,
    email_hash: lead.email
      ? createHash("sha256").update(lead.email.trim().toLowerCase()).digest("hex")
      : null,
    call_start: lead.startTime ?? null,
    variant: lead.meta.variant ?? null,
    utm_source: lead.meta.utm_source ?? null,
    utm_campaign: lead.meta.utm_campaign ?? null,
    utm_content: lead.meta.utm_content ?? null,
    from_ad: Boolean(lead.meta.fbc || lead.meta.utm_source),
    capi_ok: capi.ok,
    capi_detail: capi,
  });

  // Always 200 once the signature checks out, so cal.com does not retry a
  // booking whose only problem is on the Meta side.
  return NextResponse.json({ ok: true, eventId, capi: capi.ok });
}
