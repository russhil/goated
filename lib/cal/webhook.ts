import { createHmac, timingSafeEqual } from "node:crypto";

// cal.com signs the raw request body with HMAC-SHA256 and sends the hex digest
// in x-cal-signature-256.
export function verifyCalSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

type CalResponseField = { value?: unknown } | string | undefined;

export type CalBookingPayload = {
  uid?: string;
  title?: string;
  startTime?: string;
  attendees?: { email?: string; name?: string; firstName?: string; lastName?: string }[];
  responses?: Record<string, CalResponseField>;
  metadata?: Record<string, unknown>;
};

export type BookingLead = {
  uid: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  startTime?: string;
  meta: Record<string, string>;
};

function responseValue(field: CalResponseField): string | undefined {
  const v = typeof field === "object" && field !== null ? field.value : field;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

// Pulls the fields the Lead event needs out of a BOOKING_CREATED payload.
// Tracking context arrives in payload.metadata, set by the embed's
// "metadata[key]" config on the landing page.
export function extractLead(payload: CalBookingPayload): BookingLead | null {
  if (!payload.uid) return null;
  const attendee = payload.attendees?.[0];
  const fullName = attendee?.name ?? responseValue(payload.responses?.name) ?? "";
  const [first, ...rest] = fullName.trim().split(/\s+/);

  const meta: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload.metadata ?? {})) {
    if (typeof v === "string" && v) meta[k] = v.slice(0, 500);
  }

  return {
    uid: payload.uid,
    email: attendee?.email ?? responseValue(payload.responses?.email),
    phone:
      responseValue(payload.responses?.attendeePhoneNumber) ??
      responseValue(payload.responses?.phone),
    firstName: attendee?.firstName || first || undefined,
    lastName: attendee?.lastName || rest.join(" ") || undefined,
    startTime: payload.startTime,
    meta,
  };
}
