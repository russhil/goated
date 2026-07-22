// Weekly reminder cron: prospect follow-ups + client week/progress check-in.
//
// Armed by vercel.json ("30 3 * * 0" = Sun ~09:00 IST). Vercel injects
// `Authorization: Bearer <CRON_SECRET>` into cron invocations when CRON_SECRET
// is set, so we require it — anything else is rejected. The same route can be
// hit manually with that bearer token to force a run.

import { revalidateTag } from "next/cache";
import { HQ_TAG } from "@/lib/hq-data";
import { sendDueFollowups, sendClientWeeksDigest } from "@/lib/followups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // never run un-secured
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  const [followups, clients] = await Promise.all([sendDueFollowups(), sendClientWeeksDigest()]);

  // The follow-up run bumped next_followup_at on the due rows — refresh the tool.
  revalidateTag(HQ_TAG);

  return Response.json({ ok: true, followups: followups.count, clients: clients.count });
}
