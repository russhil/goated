import { createHash } from "node:crypto";

// Meta Conversions API client. Every browser pixel event is mirrored here with
// the same event_id so Meta deduplicates the pair instead of double counting.

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";

export type CapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
};

export type CapiEvent = {
  name: "PageView" | "ViewContent" | "Lead" | "Schedule";
  eventId: string;
  eventTime?: number;
  sourceUrl?: string;
  user: CapiUserData;
  customData?: Record<string, string | number>;
};

export type CapiResult =
  | { ok: true; eventsReceived: number; fbtraceId?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; status: number; error: string };

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashed(value: string | undefined, normalize: (v: string) => string) {
  if (!value) return undefined;
  const clean = normalize(value);
  return clean ? [sha256(clean)] : undefined;
}

const lower = (v: string) => v.trim().toLowerCase();

// Meta wants digits only with country code. Indian 10-digit numbers get 91.
export function normalizePhone(v: string): string {
  const digits = v.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export function buildUserData(user: CapiUserData) {
  const data: Record<string, string | string[]> = {};
  const em = hashed(user.email, lower);
  const ph = hashed(user.phone, normalizePhone);
  const fn = hashed(user.firstName, lower);
  const ln = hashed(user.lastName, lower);
  const externalId = hashed(user.externalId, lower);
  if (em) data.em = em;
  if (ph) data.ph = ph;
  if (fn) data.fn = fn;
  if (ln) data.ln = ln;
  if (externalId) data.external_id = externalId;
  // These four are sent in the clear by Meta's spec.
  if (user.ip) data.client_ip_address = user.ip;
  if (user.userAgent) data.client_user_agent = user.userAgent;
  if (user.fbp) data.fbp = user.fbp;
  if (user.fbc) data.fbc = user.fbc;
  return data;
}

export function buildPayload(events: CapiEvent[]) {
  const payload: Record<string, unknown> = {
    data: events.map((e) => ({
      event_name: e.name,
      event_time: e.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: e.eventId,
      action_source: "website",
      ...(e.sourceUrl ? { event_source_url: e.sourceUrl } : {}),
      user_data: buildUserData(e.user),
      ...(e.customData ? { custom_data: e.customData } : {}),
    })),
  };
  // Set only while verifying in Events Manager > Test events.
  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }
  return payload;
}

export async function sendCapiEvents(events: CapiEvent[]): Promise<CapiResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) {
    return { ok: false, skipped: true, reason: "meta env not configured" };
  }

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(events)),
      signal: AbortSignal.timeout(8000),
    }
  );

  const body = (await res.json().catch(() => ({}))) as {
    events_received?: number;
    fbtrace_id?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    return {
      ok: false,
      skipped: false,
      status: res.status,
      error: body.error?.message ?? "capi request failed",
    };
  }
  return { ok: true, eventsReceived: body.events_received ?? 0, fbtraceId: body.fbtrace_id };
}
