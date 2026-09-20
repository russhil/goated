import { NextResponse, type NextRequest } from "next/server";
import { sendCapiEvents } from "@/lib/meta/capi";

// Server-side mirror for the browser pixel's PageView and ViewContent events.
// Lead is never accepted here: it only fires from the signed cal.com webhook.

const ALLOWED = new Set(["PageView", "ViewContent"]);
const HITS = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 20;

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

const str = (v: unknown, max: number) =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined;

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (rateLimited(ip || "unknown")) {
    return NextResponse.json({ ok: false, error: "rate limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const name = str(body.name, 20);
  const eventId = str(body.eventId, 80);
  if (!name || !ALLOWED.has(name) || !eventId) {
    return NextResponse.json({ ok: false, error: "invalid event" }, { status: 400 });
  }

  const variant = str(body.variant, 4);
  const result = await sendCapiEvents([
    {
      name: name as "PageView" | "ViewContent",
      eventId,
      sourceUrl: str(body.url, 500),
      user: {
        ip: ip || undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
        fbp: str(body.fbp, 120),
        fbc: str(body.fbc, 300),
      },
      ...(variant ? { customData: { variant } } : {}),
    },
  ]);

  if (!result.ok && !result.skipped) {
    console.error("[meta] capi event failed", result.status, result.error);
  }
  // The caller's own IP goes back so the booking can carry it to the webhook.
  return NextResponse.json({ ok: result.ok, ip });
}
