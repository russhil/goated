import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Lightweight in-memory rate limit by IP. Resets when the server restarts —
// good enough for protecting a contact form on a small site. For production
// scale, swap in Upstash/Redis.
const HITS = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
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

  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim() || null;
  const message = body.message?.trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "name, email, message required" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email" }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ ok: false, error: "message too long" }, { status: 400 });
  }

  // 1. Persist to Supabase first — this is the source of truth.
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("contact_submissions")
    .insert({ name, email, phone, message })
    .select("id")
    .single();

  if (error) {
    console.error("contact insert failed", error);
    return NextResponse.json(
      { ok: false, error: "could not save submission" },
      { status: 500 }
    );
  }

  // 2. Mirror to Formspree for email notification (best-effort, don't fail request).
  let forwarded = false;
  const formspree = process.env.FORMSPREE_ENDPOINT;
  if (formspree) {
    try {
      const res = await fetch(formspree, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      forwarded = res.ok;
    } catch (err) {
      console.error("formspree forward failed", err);
    }
  }

  if (forwarded && row) {
    await admin
      .from("contact_submissions")
      .update({ forwarded_to_email: true })
      .eq("id", row.id);
  }

  return NextResponse.json({ ok: true });
}
