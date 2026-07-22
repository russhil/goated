// Prospect follow-up + weekly client check-in reminders.
//
// One shared engine behind three triggers: the weekly Vercel Cron
// (app/api/cron/followups), a `requireAdmin` server action fired by the in-app
// countdown ticker, and the bot's /followups /weeks commands. Reminders are
// broadcast to every id in TELEGRAM_ALLOWED_IDS (chat_id == user_id for DMs).
//
// Cadence: weekly by default (next Sunday ~09:00 IST). Set PROSPECT_FOLLOWUP_TEST=1
// to switch to a 30-second timer for testing — no code change to flip back.

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage } from "@/lib/telegram";
import { rollup, weeksElapsed, type Client, type Subproject } from "@/lib/hq";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const TEST_MODE = process.env.PROSPECT_FOLLOWUP_TEST === "1";

// Next follow-up time: 30s out in test mode, otherwise the upcoming Sunday at
// 03:30 UTC (~09:00 IST). Always strictly in the future.
export function nextFollowupAt(from: Date = new Date()): string {
  if (TEST_MODE) return new Date(from.getTime() + 30_000).toISOString();
  const d = new Date(from);
  d.setUTCHours(3, 30, 0, 0);
  let delta = (7 - d.getUTCDay()) % 7; // days until Sunday (0 = today is Sunday)
  if (delta === 0 && d.getTime() <= from.getTime()) delta = 7;
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString();
}

function alertChatIds(): string[] {
  return (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function broadcast(text: string): Promise<void> {
  await Promise.all(alertChatIds().map((id) => sendMessage(id, text)));
}

type DueProspect = {
  id: string;
  name: string;
  company: string | null;
  stage: string;
  reached_out: boolean | null;
};

// Days since a date string, floored (for "5d ago" style context in the digest).
function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

// Find prospects whose timer has elapsed (excluding won/lost), nudge us, then
// bump each one to the next cadence so it doesn't fire again until due.
export async function sendDueFollowups(): Promise<{ count: number }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("prospects")
    .select("id, name, company, stage, reached_out, created_at")
    .lte("next_followup_at", nowIso)
    .not("stage", "in", "(won,lost)");

  const due = (data ?? []) as (DueProspect & { created_at: string })[];
  if (due.length === 0) return { count: 0 };

  const lines = [`🔔 <b>${due.length} prospect${due.length > 1 ? "s" : ""} to follow up</b>`];
  for (const p of due) {
    const age = daysAgo(p.created_at);
    const bits = [p.stage, p.reached_out ? "reached out" : "not reached", age !== null ? `${age}d old` : null]
      .filter(Boolean)
      .join(", ");
    lines.push(`• <b>${esc(p.name)}</b>${p.company ? ` (${esc(p.company)})` : ""} — ${bits}`);
  }
  await broadcast(lines.join("\n"));

  const next = nextFollowupAt();
  await admin
    .from("prospects")
    .update({ next_followup_at: next, last_reminded_at: nowIso })
    .in("id", due.map((p) => p.id));

  return { count: due.length };
}

// "Week N, X% done" per live client — the body of the weekly check-in. Returned
// as a string so both the broadcast and the bot's /weeks reply can use it.
export async function buildClientWeeksDigest(): Promise<string | null> {
  const admin = createAdminClient();
  const [clientsRes, subsRes] = await Promise.all([
    admin.from("clients").select("*").eq("archived", false).eq("completed", false),
    admin.from("client_subprojects").select("*"),
  ]);
  const clients = (clientsRes.data ?? []) as Client[];
  const subs = (subsRes.data ?? []) as Subproject[];
  if (clients.length === 0) return null;

  const byClient = new Map<string, Subproject[]>();
  for (const s of subs) {
    const arr = byClient.get(s.client_id) ?? [];
    arr.push(s);
    byClient.set(s.client_id, arr);
  }

  const lines = ["📅 <b>Weekly client check-in</b>"];
  for (const c of clients) {
    const cs = byClient.get(c.id) ?? [];
    const weeks = weeksElapsed(c.kickoff_date);
    const prog = Math.round(rollup(cs, c.kickoff_date).progress);
    lines.push(`• <b>${esc(c.name)}</b> — week ${weeks}, ${prog}% done`);
  }
  return lines.join("\n");
}

export async function sendClientWeeksDigest(): Promise<{ count: number }> {
  const digest = await buildClientWeeksDigest();
  if (!digest) return { count: 0 };
  await broadcast(digest);
  // count of "• " lines
  return { count: digest.split("\n").length - 1 };
}
