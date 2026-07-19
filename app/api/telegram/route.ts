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

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessage, sendDocument } from "@/lib/telegram";
import { parseIntent, type BotIntent } from "@/lib/gemini";
import { buildInvoicePdf, type InvoiceRow } from "@/lib/invoice-pdf";
import { getInrRates } from "@/lib/fx";
import {
  summarizeInInr,
  subOffTrack,
  formatMoney,
  PEOPLE,
  EXPENSE_CATEGORIES,
  type Client,
  type Subproject,
  type Phase,
} from "@/lib/hq";
import { computeBalances, primaryBalance } from "@/app/admin/hq/finance/splitwise";
import { isStage } from "@/app/admin/hq/prospects/stages";

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
  "Commands:",
  "/summary — INR P&amp;L snapshot",
  "/balance — petty-cash who-owes-who",
  "/offtrack — sub-projects behind schedule",
  "/whoami — your Telegram id",
  "",
  "Or just type, e.g.:",
  "• Vansh paid 500 for coffee",
  "• add expense software 999 Vercel",
  "• add prospect Acme Corp",
  "• invoice for Azadi Records",
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
  await sendMessage(
    chatId,
    `✅ Added expense: <b>${esc(category)}</b> ${formatMoney(amount, "INR")}${vendor ? ` — ${esc(vendor)}` : ""}`
  );
}

async function handleAddProspect(
  chatId: number,
  intent: Extract<BotIntent, { intent: "add_prospect" }>
): Promise<void> {
  const name = intent.name.trim();
  if (!name) {
    await sendMessage(chatId, "A prospect needs a name.");
    return;
  }
  const stage = intent.stage && isStage(intent.stage) ? intent.stage : "new";
  const company = (intent.company || "").trim() || null;
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").insert({ name, company, stage });
  if (error) {
    await sendMessage(chatId, "⚠️ couldn't save that prospect");
    return;
  }
  await sendMessage(
    chatId,
    `✅ Added prospect: <b>${esc(name)}</b>${company ? ` (${esc(company)})` : ""} — ${esc(stage)}`
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

// ---- router ----------------------------------------------------------------

async function handle(text: string, fromId: number, chatId: number): Promise<void> {
  const trimmed = text.trim();
  const isCommand = trimmed.startsWith("/");
  const cmd = isCommand ? trimmed.slice(1).split(/\s+/)[0].split("@")[0].toLowerCase() : "";

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
      default:
        await sendMessage(chatId, "Unknown command — try /help");
        return;
    }
  }

  const intent = await parseIntent(trimmed);
  if (!intent || intent.intent === "unknown") {
    await sendMessage(chatId, "Didn't get that — try /help");
    return;
  }

  switch (intent.intent) {
    case "add_petty_cash":
      await handleAddPettyCash(chatId, intent);
      return;
    case "add_expense":
      await handleAddExpense(chatId, intent);
      return;
    case "add_prospect":
      await handleAddProspect(chatId, intent);
      return;
    case "get_invoice":
      await handleGetInvoice(chatId, intent);
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
