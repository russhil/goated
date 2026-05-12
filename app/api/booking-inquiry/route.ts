import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPostHogClient } from "@/lib/posthog-server";

const HITS = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
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

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: { name?: string; email?: string; businessDescription?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const businessDescription = body.businessDescription?.trim();

  if (!name || !email || !businessDescription) {
    return NextResponse.json(
      { ok: false, error: "name, email, businessDescription required" },
      { status: 400 }
    );
  }
  if (name.length > 100) {
    return NextResponse.json({ ok: false, error: "name too long" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }
  if (businessDescription.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Tell us a bit more (at least 20 characters)." },
      { status: 400 }
    );
  }
  if (businessDescription.length > 1000) {
    return NextResponse.json(
      { ok: false, error: "Please keep it under 1000 characters." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("booking_inquiries")
    .insert({ name, email, business_description: businessDescription })
    .select("id")
    .single();

  if (error) {
    console.error("booking-inquiry insert failed", error);
    return NextResponse.json(
      { ok: false, error: "could not save submission" },
      { status: 500 }
    );
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: email,
    event: "booking_inquiry_saved",
    properties: { inquiry_id: row.id, name },
  });
  await posthog.shutdown();

  return NextResponse.json({ ok: true, inquiryId: row.id });
}
