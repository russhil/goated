// Private Telegram bot webhook for the Admin HQ back office.
//
// Security model:
//  - Every request must carry the shared secret in the
//    `x-telegram-bot-api-secret-token` header (set when registering the webhook).
//    A mismatch is silently 200'd so we never reveal the endpoint exists.
//  - Beyond /whoami and /start, the sender's numeric id must be in
//    TELEGRAM_ALLOWED_IDS. Everyone else gets "Not authorized."
//  - All data access goes through the service-role client, already gated by the
//    allowlist above — mirroring the requireAdmin() pattern used elsewhere.
// The handler always returns 200 quickly so Telegram never retries.

import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { HQ_TAG } from "@/lib/hq-data";
import { logAudit } from "@/lib/audit";
import { sendMessage, sendDocument } from "@/lib/telegram";
import { parseIntent, type BotIntent } from "@/lib/gemini";
import { buildInvoicePdf, type InvoiceRow } from "@/lib/invoice-pdf";
import { getInrRates } from "@/lib/fx";
import {
  summarizeInInr,
  subOffTrack,
  subProgress,
  rollup,
  weeksElapsed,
  formatMoney,
  PEOPLE,
  EXPENSE_CATEGORIES,
  type Client,
  type Subproject,
  type Phase,
} from "@/lib/hq";
import { computeBalances, primaryBalance } from "@/app/hq/finance/splitwise";
import { sendDueFollowups, buildClientWeeksDigest } from "@/lib/followups";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TgUpdate = {
  message?: {
    text?: string;
    from?: { id?: number };
    chat?: { id?: number };
  };
};

// ---- helpers ---------------------------------------------------------------

// Escape untrusted text before it goes into an HTML-parsed message.
function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function validDate(s?: string): string | null {
  const t = (s || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function matchPerson(s: string): (typeof PEOPLE)[number] | null {
  const t = (s || "").trim().toLowerCase();
  return PEOPLE.find((p) => p.toLowerCase() === t) ?? null;
}

function isAllowed(fromId: number): boolean {
  const ids = (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.includes(String(fromId));
}

const HELP = [
  "<b>Goated ops bot</b>",
  "",
  "<b>Commands</b>",
  "/summary — INR P&amp;L snapshot",
  "/balance — petty-cash who-owes-who",
  "/offtrack — sub-projects behind schedule",
  "/client &lt;name&gt; — client snapshot (progress, weeks, collected)",
  "/weeks — every client: week # + progress",
  "/invoice &lt;client&gt; [phase] — fetch an invoice PDF",
  "/followups — nudge prospects due for follow-up now",
  "/reminders — your upcoming reminders",
  "/whoami — your Telegram id",
  "/help — this message",
  "",
  "<b>Reminders (like an alarm)</b>",
  "• remind me to text Sam tomorrow",
  "• remind me to send the invoice at 6pm",
  "• remind me to call the accountant in 2 hours",
  "",
  "<b>Log things (just type)</b> — only these two write",
  "• Vansh paid 500 for coffee — petty cash",
  "• add expense software 999 Vercel — company expense",
  "",
  "<b>Pull info</b>",
  "• how's Azadi Records doing — client snapshot",
  "• invoice for Azadi Records — or: fetch phase 1 invoice for zenspace",
  "",
  "<b>Ask anything (ad-hoc lookups)</b>",
  "• which clients are off track",
  "• total collected from Azadi",
  "• prospects in proposal stage",
  "• how many invoices this month",
  "",
  "<i>Weekly (Sun): auto follow-up + client check-in reminders.</i>",
].join("\n");

// ---- shared command handlers ----------------------------------------------

async function handleSummary(chatId: number): Promise<void> {
  const admin = createAdminClient();
  const [clientsRes, subsRes, pettyRes, expRes, rates] = await Promise.all([
    admin.from("clients").select("*").eq("archived", false),
    admin.from("client_subprojects").select("*"),
    admin.from("petty_cash").select("currency, amount"),
    admin.from("company_expenses").select("currency, amount"),
    getInrRates(),
  ]);

  const activeClients = (clientsRes.data ?? []) as Client[];
  const subs = (subsRes.data ?? []) as Subproject[];
  const subsByClient = new Map<string, Subproject[]>();
  for (const s of subs) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }
  const petty = (pettyRes.data ?? []) as { currency: string; amount: number }[];
  const expenses = (expRes.data ?? []) as { currency: string; amount: number }[];

  const t = summarizeInInr(activeClients, subsByClient, petty, expenses, rates);
  await sendMessage(
    chatId,
    [
      "<b>Financial summary</b> (₹ equiv)",
      `Contract: ${formatMoney(t.contract, "INR")}`,
      `Collected: ${formatMoney(t.collected, "INR")}`,
      `Outstanding: ${formatMoney(t.outstanding, "INR")}`,
      `Project cost: ${formatMoney(t.cost, "INR")}`,
      `Expenses: ${formatMoney(t.expenses, "INR")}`,
      `<b>Net (cash): ${formatMoney(t.net, "INR")}</b>`,
    ].join("\n")
  );
}

async function handleBalance(chatId: number): Promise<void> {
  const admin = createAdminClient();
  const [pettyRes, settleRes] = await Promise.all([
    admin.from("petty_cash").select("payer, amount, currency"),
    admin.from("petty_cash_settlements").select("from_person, to_person, amount, currency"),
  ]);
  const petty = (pettyRes.data ?? []) as { payer: string | null; amount: number; currency: string }[];
  const settlements = (settleRes.data ?? []) as {
    from_person: string;
    to_person: string;
    amount: number;
    currency: string;
  }[];

  const owed = computeBalances(petty, settlements).filter((b) => b.debtor && b.creditor);
  if (owed.length === 0) {
    await sendMessage(chatId, "🤝 Settled up — no outstanding petty-cash balance.");
    return;
  }
  const primary = primaryBalance(owed); // headline currency: INR if present, else largest
  const lines = ["<b>Petty-cash balance</b>"];
  if (primary && primary.debtor && primary.creditor) {
    lines.push(`${esc(primary.debtor)} owes ${esc(primary.creditor)} ${formatMoney(primary.amount, primary.currency)}`);
  }
  for (const b of owed) {
    if (primary && b.currency === primary.currency) continue;
    lines.push(`${esc(b.debtor!)} owes ${esc(b.creditor!)} ${formatMoney(b.amount, b.currency)}`);
  }
  await sendMessage(chatId, lines.join("\n"));
}

async function handleOfftrack(chatId: number): Promise<void> {
  const admin = createAdminClient();
  const [clientsRes, subsRes] = await Promise.all([
    admin.from("clients").select("*"),
    admin.from("client_subprojects").select("*"),
  ]);
  const clients = (clientsRes.data ?? []) as Client[];
  const subs = (subsRes.data ?? []) as Subproject[];

  // Only consider live clients: non-archived and not manually marked complete.
  const byId = new Map(clients.filter((c) => !c.archived && !c.completed).map((c) => [c.id, c]));
  const off: string[] = [];
  for (const s of subs) {
    const c = byId.get(s.client_id);
    if (!c) continue;
    if (subOffTrack(s, c.kickoff_date)) {
      off.push(`• <b>${esc(c.name)}</b> — ${esc(s.name)}${s.due_date ? ` (due ${s.due_date})` : ""}`);
    }
  }
  if (off.length === 0) {
    await sendMessage(chatId, "✅ Nothing off track.");
    return;
  }
  await sendMessage(chatId, ["<b>Off-track sub-projects</b>", ...off].join("\n"));
}

// ---- free-text intent handlers ---------------------------------------------

async function handleAddPettyCash(
  chatId: number,
  intent: Extract<BotIntent, { intent: "add_petty_cash" }>
): Promise<void> {
  const payer = matchPerson(intent.payer);
  if (!payer) {
    await sendMessage(chatId, `Payer must be one of: ${PEOPLE.join(", ")}.`);
    return;
  }
  const amount = Number(intent.amount);
  if (!(amount > 0)) {
    await sendMessage(chatId, "Amount must be greater than 0.");
    return;
  }
  const purpose = intent.purpose.trim();
  if (!purpose) {
    await sendMessage(chatId, "What was it for? Please include a purpose.");
    return;
  }
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").insert({
    payer,
    purpose,
    amount,
    currency: "INR",
    spent_on: validDate(intent.date) ?? today(),
  });
  if (error) {
    await sendMessage(chatId, "⚠️ couldn't save that petty-cash entry");
    return;
  }
  await logAudit({ actor: "telegram", action: "create", entity: "petty_cash", summary: `Added petty cash: ${payer} ${formatMoney(amount, "INR")} — ${purpose}` });
  revalidateTag(HQ_TAG); // reflect on the tool immediately
  await sendMessage(chatId, `✅ Added petty cash: <b>${esc(payer)}</b> ${formatMoney(amount, "INR")} — ${esc(purpose)}`);
}

async function handleAddExpense(
  chatId: number,
  intent: Extract<BotIntent, { intent: "add_expense" }>
): Promise<void> {
  const amount = Number(intent.amount);
  if (!(amount > 0)) {
    await sendMessage(chatId, "Amount must be greater than 0.");
    return;
  }
  const category = EXPENSE_CATEGORIES.includes(intent.category as (typeof EXPENSE_CATEGORIES)[number])
    ? intent.category
    : "misc";
  const vendor = (intent.vendor || "").trim() || null;
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").insert({
    category,
    vendor,
    amount,
    currency: "INR",
    incurred_on: validDate(intent.date) ?? today(),
  });
  if (error) {
    await sendMessage(chatId, "⚠️ couldn't save that expense");
    return;
  }
  await logAudit({ actor: "telegram", action: "create", entity: "expense", summary: `Added expense: ${category} ${formatMoney(amount, "INR")}${vendor ? ` — ${vendor}` : ""}` });
  revalidateTag(HQ_TAG); // reflect on the tool immediately
  await sendMessage(
    chatId,
    `✅ Added expense: <b>${esc(category)}</b> ${formatMoney(amount, "INR")}${vendor ? ` — ${esc(vendor)}` : ""}`
  );
}

async function handleGetInvoice(
  chatId: number,
  intent: Extract<BotIntent, { intent: "get_invoice" }>
): Promise<void> {
  const admin = createAdminClient();
  const q = intent.client.trim().toLowerCase();
  const { data: clients } = await admin.from("clients").select("id, name");
  const list = (clients ?? []) as { id: string; name: string }[];
  const client =
    list.find((c) => (c.name || "").toLowerCase() === q) ??
    list.find((c) => (c.name || "").toLowerCase().includes(q));
  if (!client) {
    await sendMessage(chatId, `Couldn't find a client matching "${esc(intent.client)}".`);
    return;
  }

  const { data: subs } = await admin
    .from("client_subprojects")
    .select("id, phases")
    .eq("client_id", client.id);
  const phases: Phase[] = [];
  for (const sp of (subs ?? []) as { phases: Phase[] | null }[]) {
    for (const ph of Array.isArray(sp.phases) ? sp.phases : []) {
      if (ph && ph.id && ph.date) phases.push(ph);
    }
  }
  if (phases.length === 0) {
    await sendMessage(chatId, `No dated phases found for <b>${esc(client.name)}</b> yet.`);
    return;
  }

  let chosen: Phase | undefined;
  if (intent.phase) {
    const pq = intent.phase.trim().toLowerCase();
    chosen = phases.find((p) => (p.name || "").toLowerCase().includes(pq));
  }
  if (!chosen) {
    // Most recent dated phase.
    chosen = [...phases].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];
  }
  if (!chosen?.id) {
    await sendMessage(chatId, "Couldn't match a phase for that invoice.");
    return;
  }

  const { data: inv } = await admin.from("invoices").select("*").eq("phase_id", chosen.id).maybeSingle();
  if (!inv) {
    await sendMessage(
      chatId,
      `No invoice exists yet for that phase — generate it in the tool first (Clients → ${esc(client.name)}).`
    );
    return;
  }

  const row = inv as InvoiceRow & { invoice_no: string };
  const bytes = await buildInvoicePdf(row);
  await sendDocument(chatId, `INV_${row.invoice_no}.pdf`, bytes, `Invoice ${esc(row.invoice_no)} — ${esc(client.name)}`);
}

// Split "/invoice <client> [phase words]" args into a client and optional phase.
// If the word "phase" appears (not at the very start), everything before it is
// the client and "phase …" is the phase filter; otherwise it's all the client.
function parseInvoiceArgs(args: string): { client: string; phase?: string } {
  const trimmed = args.trim();
  const m = trimmed.match(/\bphase\b/i);
  if (m && typeof m.index === "number" && m.index > 0) {
    const client = trimmed.slice(0, m.index).trim();
    const phase = trimmed.slice(m.index).trim();
    if (client) return { client, phase: phase || undefined };
  }
  return { client: trimmed };
}

// ---- client snapshot + reminders -------------------------------------------

async function handleClientInfo(chatId: number, clientQuery: string): Promise<void> {
  const admin = createAdminClient();
  const q = clientQuery.trim().toLowerCase();
  const { data: clients } = await admin.from("clients").select("*");
  const list = (clients ?? []) as Client[];
  const client =
    list.find((c) => (c.name || "").toLowerCase() === q) ??
    list.find((c) => (c.name || "").toLowerCase().includes(q));
  if (!client) {
    await sendMessage(chatId, `Couldn't find a client matching "${esc(clientQuery)}".`);
    return;
  }

  const { data: subsData } = await admin
    .from("client_subprojects")
    .select("*")
    .eq("client_id", client.id);
  const subs = (subsData ?? []) as Subproject[];
  const r = rollup(subs, client.kickoff_date);
  const weeks = weeksElapsed(client.kickoff_date);

  const lines = [
    `<b>${esc(client.name)}</b>${client.industry ? ` — ${esc(client.industry)}` : ""}`,
    `Week ${weeks}${client.kickoff_date ? ` (kickoff ${client.kickoff_date})` : ""}`,
    `Progress: ${Math.round(r.progress)}%${r.offTrack ? " ⚠️ off track" : ""}`,
    `Contract: ${formatMoney(r.totalContract, client.currency)}`,
    `Collected: ${formatMoney(r.collected, client.currency)}`,
    `Outstanding: ${formatMoney(r.outstanding, client.currency)}`,
  ];
  if (subs.length) {
    lines.push("", "<b>Sub-projects</b>");
    for (const s of subs) {
      lines.push(
        `• ${esc(s.name)} — ${subProgress(s)}%${subOffTrack(s, client.kickoff_date) ? " ⚠️" : ""}`
      );
    }
  }
  await sendMessage(chatId, lines.join("\n"));
}

async function handleClientWeeks(chatId: number): Promise<void> {
  const digest = await buildClientWeeksDigest();
  await sendMessage(chatId, digest ?? "No active clients right now.");
}

async function handleFollowups(chatId: number): Promise<void> {
  const { count } = await sendDueFollowups();
  if (count > 0) revalidateTag(HQ_TAG);
  await sendMessage(
    chatId,
    count > 0
      ? `Nudged ${count} due prospect${count > 1 ? "s" : ""}.`
      : "✅ No prospects are due for follow-up right now."
  );
}

// ---- personal reminders ("remind me to text xyz tomorrow") -----------------
// Stored here; fired at the exact time by the self-hosted alarm daemon
// (scripts/reminder-alarm.mjs), NOT a Vercel cron.

function istLabel(d: Date): string {
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function handleAddReminder(
  chatId: number,
  intent: Extract<BotIntent, { intent: "add_reminder" }>
): Promise<void> {
  const t = new Date(intent.remindAt);
  if (Number.isNaN(t.getTime())) {
    await sendMessage(chatId, 'Couldn\'t work out the time — try e.g. "remind me to text Sam tomorrow 9am".');
    return;
  }
  if (t.getTime() <= Date.now() + 5000) {
    await sendMessage(chatId, "That time's already passed — give me a future time.");
    return;
  }
  const text = (intent.text || "").trim().slice(0, 500) || "(reminder)";
  const admin = createAdminClient();
  const { error } = await admin
    .from("reminders")
    .insert({ chat_id: chatId, text, remind_at: t.toISOString() });
  if (error) {
    await sendMessage(chatId, "⚠️ couldn't save that reminder");
    return;
  }
  await logAudit({ actor: "telegram", action: "create", entity: "reminder", summary: `Set reminder for ${istLabel(t)}: ${text}` });
  await sendMessage(chatId, `⏰ Reminder set for <b>${istLabel(t)}</b>:\n${esc(text)}`);
}

async function handleListReminders(chatId: number): Promise<void> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("reminders")
    .select("text, remind_at")
    .eq("chat_id", chatId)
    .eq("sent", false)
    .gte("remind_at", new Date().toISOString())
    .order("remind_at", { ascending: true })
    .limit(20);
  const rows = (data ?? []) as { text: string; remind_at: string }[];
  if (rows.length === 0) {
    await sendMessage(chatId, "No upcoming reminders.");
    return;
  }
  const lines = ["<b>Upcoming reminders</b>"];
  for (const r of rows) lines.push(`• ${istLabel(new Date(r.remind_at))} — ${esc(r.text)}`);
  await sendMessage(chatId, lines.join("\n"));
}

// ---- read-only query intent ------------------------------------------------

// Second guard (the Gemini prompt + the exec_sql_readonly DB function are the
// other two): never trust model-authored SQL — re-check it here before running.
const FORBIDDEN_SQL = /\b(insert|update|delete|drop|alter|truncate|grant|revoke|copy|call|merge|vacuum)\b/i;

function isReadOnlySql(sql: string): boolean {
  return /^\s*(select|with)\b/i.test(sql) && !sql.includes(";") && !FORBIDDEN_SQL.test(sql);
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.length > 300) s = s.slice(0, 300) + "…";
  return s;
}

function formatRow(row: unknown): string {
  if (!row || typeof row !== "object") return esc(formatValue(row));
  const o = row as Record<string, unknown>;
  const keys = Object.keys(o);
  if (keys.length === 0) return "—";
  if (keys.length === 1) return esc(formatValue(o[keys[0]]));
  return keys.map((k) => `<b>${esc(k)}</b>: ${esc(formatValue(o[k]))}`).join(", ");
}

function toRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data === null || data === undefined) return [];
  return [data];
}

async function handleQuery(
  chatId: number,
  intent: Extract<BotIntent, { intent: "query" }>
): Promise<void> {
  // Drop trailing semicolons the model may have added, then re-validate.
  const sql = intent.sql.replace(/;+\s*$/, "").trim();
  if (!sql || !isReadOnlySql(sql)) {
    await sendMessage(chatId, "I can only run read-only lookups.");
    return;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("exec_sql_readonly", { q: sql });
  if (error) {
    // Surface the DB reason (schema-level info, admin-only chat) — makes a bad
    // column/table or a guard mismatch diagnosable instead of a blank wall.
    const reason = (error.message || "").slice(0, 200);
    await sendMessage(chatId, `⚠️ couldn't run that lookup${reason ? `: ${esc(reason)}` : " — try rephrasing."}`);
    return;
  }

  const rows = toRows(data);
  const header = intent.explain ? esc(intent.explain) : "Results";
  if (rows.length === 0) {
    await sendMessage(chatId, `${header}\n\nNo results.`);
    return;
  }

  // Append whole lines only so an HTML tag is never split by the length cap.
  const CAP = 4000;
  let msg = header;
  let shown = 0;
  let truncated = false;
  for (const r of rows) {
    if (shown >= 15) {
      truncated = true;
      break;
    }
    const line = "\n• " + formatRow(r);
    if (msg.length + line.length > CAP) {
      truncated = true;
      break;
    }
    msg += line;
    shown++;
  }
  if (truncated) msg += "\n…";
  await sendMessage(chatId, msg);
}

// ---- router ----------------------------------------------------------------

async function handle(text: string, fromId: number, chatId: number): Promise<void> {
  const trimmed = text.trim();
  const isCommand = trimmed.startsWith("/");
  const cmd = isCommand ? trimmed.slice(1).split(/\s+/)[0].split("@")[0].toLowerCase() : "";
  // Everything after the command word, e.g. "/invoice Azadi phase 1" -> "Azadi phase 1".
  const args = isCommand ? trimmed.slice(1).replace(/^\S+\s*/, "").trim() : "";

  // Always answer identity probes, even for non-allowlisted users.
  if (cmd === "whoami" || cmd === "start") {
    await sendMessage(
      chatId,
      `Your Telegram id is <code>${fromId}</code>.\nAdd this to <b>TELEGRAM_ALLOWED_IDS</b> to use the bot.`
    );
    return;
  }

  if (!isAllowed(fromId)) {
    await sendMessage(chatId, "Not authorized.");
    return;
  }

  if (isCommand) {
    switch (cmd) {
      case "help":
        await sendMessage(chatId, HELP);
        return;
      case "summary":
        await handleSummary(chatId);
        return;
      case "balance":
        await handleBalance(chatId);
        return;
      case "offtrack":
        await handleOfftrack(chatId);
        return;
      case "invoice": {
        const { client, phase } = parseInvoiceArgs(args);
        if (!client) {
          await sendMessage(chatId, "Usage: <code>/invoice &lt;client&gt; [phase]</code>");
          return;
        }
        await handleGetInvoice(chatId, { intent: "get_invoice", client, phase });
        return;
      }
      case "client": {
        if (!args) {
          await sendMessage(chatId, "Usage: <code>/client &lt;name&gt;</code>");
          return;
        }
        await handleClientInfo(chatId, args);
        return;
      }
      case "weeks":
        await handleClientWeeks(chatId);
        return;
      case "followups":
        await handleFollowups(chatId);
        return;
      case "reminders":
        await handleListReminders(chatId);
        return;
      default:
        await sendMessage(chatId, "Unknown command — try /help");
        return;
    }
  }

  const intent = await parseIntent(trimmed, new Date().toISOString());
  if (!intent) {
    // Gemini is down or GEMINI_API_KEY is unset — no free-text parsing available.
    await sendMessage(
      chatId,
      "Couldn't read that right now. Try /help, or the slash commands: /summary /balance /offtrack /client /weeks /invoice /followups /whoami."
    );
    return;
  }
  if (intent.intent === "unknown") {
    await sendMessage(chatId, "Didn't get that — try /help for commands and examples.");
    return;
  }

  switch (intent.intent) {
    case "add_petty_cash":
      await handleAddPettyCash(chatId, intent);
      return;
    case "add_expense":
      await handleAddExpense(chatId, intent);
      return;
    case "get_invoice":
      await handleGetInvoice(chatId, intent);
      return;
    case "client_info":
      await handleClientInfo(chatId, intent.client);
      return;
    case "add_reminder":
      await handleAddReminder(chatId, intent);
      return;
    case "query":
      await handleQuery(chatId, intent);
      return;
    case "summary":
      await handleSummary(chatId);
      return;
    case "balance":
      await handleBalance(chatId);
      return;
    case "offtrack":
      await handleOfftrack(chatId);
      return;
  }
}

export async function POST(req: Request): Promise<Response> {
  // Silently ignore anything without the shared secret so the endpoint never
  // confirms its own existence to a scanner.
  if (req.headers.get("x-telegram-bot-api-secret-token") !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("ok");
  }

  let chatIdForError: number | null = null;
  try {
    const update = (await req.json().catch(() => null)) as TgUpdate | null;
    const message = update?.message;
    const text = message?.text;
    const fromId = message?.from?.id;
    const chatId = message?.chat?.id;
    if (!message || typeof text !== "string" || typeof fromId !== "number" || typeof chatId !== "number") {
      return new Response("ok");
    }
    chatIdForError = chatId;
    await handle(text, fromId, chatId);
    return new Response("ok");
  } catch (e) {
    console.error("[telegram] handler error:", e instanceof Error ? e.message : "unknown");
    if (chatIdForError !== null) await sendMessage(chatIdForError, "⚠️ something went wrong");
    return new Response("ok");
  }
}
