import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Server-side rate limit check using the `rate_limits` table.
 *
 * Counts events for (user_id, action) within the trailing window.
 * If the count is at the limit, refuses; otherwise logs the event and allows.
 *
 * Uses the service-role client because regular RLS doesn't allow users to read
 * their own rate-limit log (we don't want clients lying about it).
 */
export async function checkRateLimit(opts: {
  userId: string;
  action: string;
  max: number;
  windowSec: number;
}): Promise<RateLimitResult> {
  const { userId, action, max, windowSec } = opts;
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowSec * 1000).toISOString();

  const { count, error } = await admin
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  if (error) {
    // If the table is missing or unreachable, fail-open so we don't block legit users.
    console.error("rate-limit check failed", error);
    return { ok: true };
  }

  if ((count ?? 0) >= max) {
    return { ok: false, retryAfterSec: windowSec };
  }

  await admin.from("rate_limits").insert({ user_id: userId, action });
  return { ok: true };
}
