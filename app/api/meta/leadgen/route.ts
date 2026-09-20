import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isCompanyEmail, isTargetRevenue } from "@/lib/ai/lead";
import { createAdminClient } from "@/lib/supabase/admin";

// Meta Instant Form (lead ads) webhook. Meta sends only a leadgen_id; the
// answers are fetched from the Graph API with the page token. Instant Forms
// cannot enforce a company domain, so every lead is stored and the free-mail
// ones are flagged company_email = false.

export const runtime = "nodejs";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";

// Subscription handshake: Meta calls GET once when the webhook is registered.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const expected = Buffer.from(process.env.META_WEBHOOK_VERIFY_TOKEN ?? "", "utf8");
  const given = Buffer.from(params.get("hub.verify_token") ?? "", "utf8");
  if (
    expected.length > 0 &&
    params.get("hub.mode") === "subscribe" &&
    given.length === expected.length &&
    timingSafeEqual(given, expected)
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

function verifySignature(raw: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(raw).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(header.slice(7).trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type LeadgenChange = {
  field?: string;
  value?: { leadgen_id?: string; form_id?: string; ad_id?: string; adgroup_id?: string };
};

type GraphLead = {
  id: string;
  created_time?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
  form_id?: string;
  field_data?: { name: string; values?: string[] }[];
};

// Form question keys vary with how the form was built; match on substrings.
function pick(fields: Record<string, string>, ...needles: string[]) {
  for (const [key, value] of Object.entries(fields)) {
    if (needles.some((n) => key.includes(n))) return value;
  }
  return undefined;
}

// Maps the Instant Form's revenue answer onto the website form's bands.
function revenueBand(answer: string | undefined) {
  const a = (answer ?? "").toLowerCase().replace(/[\s_₹]/g, "");
  if (!a) return null;
  if (a.includes("above100") || a.includes("over100") || a.includes("100cr+")) return "over_100cr";
  if (a.includes("25")) return a.startsWith("5") ? "5_25cr" : "25_100cr";
  if (a.includes("under5") || a.includes("below5")) return "under_5cr";
  return null;
}

async function ingest(leadgenId: string, token: string) {
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}?fields=created_time,ad_id,adset_id,campaign_id,form_id,field_data&access_token=${encodeURIComponent(token)}`,
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) {
    console.error("[leadgen] graph fetch failed", res.status);
    return;
  }
  const lead = (await res.json()) as GraphLead;
  const fields: Record<string, string> = {};
  for (const f of lead.field_data ?? []) fields[f.name.toLowerCase()] = f.values?.[0] ?? "";

  const email = pick(fields, "work_email", "email") ?? "";
  const band = revenueBand(pick(fields, "revenue", "turnover"));

  const { error } = await createAdminClient()
    .from("ad_leads")
    .upsert(
      {
        source: "instant_form",
        meta_lead_id: lead.id,
        name: pick(fields, "full_name", "name") ?? null,
        email: email.trim().toLowerCase() || null,
        company: pick(fields, "company") ?? null,
        phone: pick(fields, "phone") ?? null,
        revenue_band: band,
        company_email: isCompanyEmail(email),
        target_revenue: band ? isTargetRevenue(band) : false,
        ad_id: lead.ad_id ?? null,
        adset_id: lead.adset_id ?? null,
        campaign_id: lead.campaign_id ?? null,
        form_id: lead.form_id ?? null,
        from_ad: true,
        raw: fields,
      },
      { onConflict: "meta_lead_id" }
    );
  if (error) console.error("[leadgen] insert failed", error.message);
}

export async function POST(request: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!appSecret || !pageToken) {
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }

  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
  }

  let body: { entry?: { changes?: LeadgenChange[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const ids = (body.entry ?? [])
    .flatMap((e) => e.changes ?? [])
    .filter((c) => c.field === "leadgen" && /^\d+$/.test(c.value?.leadgen_id ?? ""))
    .map((c) => c.value!.leadgen_id!);

  await Promise.all(
    ids.map((id) =>
      ingest(id, pageToken).catch((e) =>
        console.error("[leadgen] ingest threw", e instanceof Error ? e.message : "unknown")
      )
    )
  );

  return NextResponse.json({ ok: true, received: ids.length });
}
