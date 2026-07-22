// Gemini-backed natural-language intent parser for the Telegram bot.
// parseIntent() maps a free-text message to ONE structured BotIntent and NEVER
// throws: if GEMINI_API_KEY is unset, the HTTP call fails, or the model returns
// something unparseable, it returns null and the caller falls back to /help.

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type BotIntent =
  | { intent: "add_petty_cash"; payer: string; amount: number; purpose: string; date?: string }
  | { intent: "add_expense"; category: string; vendor?: string; amount: number; date?: string }
  | { intent: "get_invoice"; client: string; phase?: string }
  | { intent: "client_info"; client: string }
  | { intent: "add_reminder"; text: string; remindAt: string }
  | { intent: "query"; sql: string; explain: string }
  | { intent: "summary" }
  | { intent: "balance" }
  | { intent: "offtrack" }
  | { intent: "unknown" };

function systemInstruction(now: string): string {
  const today = now.slice(0, 10);
  return `You route short internal-ops messages for a software agency's back office ("Goated") into ONE structured intent, OR into a single read-only database query. Reply with STRICT JSON only — one object, no prose, no markdown fences.

CURRENT INSTANT is ${now} (ISO 8601, UTC). TODAY'S DATE is ${today}. The user's timezone is Asia/Kolkata (IST, UTC+05:30). Resolve every natural date the user gives ("13th july 2026", "yesterday", "last friday", "next month") to an absolute YYYY-MM-DD relative to today. Include "date" only when the message states one. Money defaults to INR. Never invent values the user did not state.

WRITES ARE STRICTLY LIMITED. The ONLY operations that may change BUSINESS data are add_petty_cash and add_expense. (add_reminder is separate — it just sets a personal reminder for the user, no business data.) Any request to create, add, update, edit, or delete ANYTHING else (a prospect/lead, client, sub-project, invoice, team member, settlement) is NOT supported — return {"intent":"unknown"}. Never invent a write intent for those.

Pick exactly ONE shape:

1) add_petty_cash — a PERSONAL out-of-pocket spend by one of the two partners (Vansh or Russhil). Reimbursable, split 50/50. Use ONLY when a partner (Vansh/Russhil) is named as the payer.
   {"intent":"add_petty_cash","payer":"Vansh"|"Russhil","amount":<number>,"purpose":"<what for>","date":"YYYY-MM-DD"?}
   e.g. "Vansh paid 500 for coffee" -> {"intent":"add_petty_cash","payer":"Vansh","amount":500,"purpose":"coffee"}

2) add_expense — a COMPANY/business cost tied to a vendor or category, with NO personal payer. Use when no partner is named as payer.
   {"intent":"add_expense","category":"<rent|salaries|subscriptions|software|marketing|travel|misc>","vendor":"<optional>","amount":<number>,"date":"YYYY-MM-DD"?}
   e.g. "add expense software 999 vercel on 13th july 2026" -> {"intent":"add_expense","category":"software","vendor":"Vercel","amount":999,"date":"2026-07-13"}

3) get_invoice — fetch a client's invoice PDF. Maps "invoice for X", "fetch phase N invoice for X", "get X's invoice", "X phase 2 invoice".
   {"intent":"get_invoice","client":"<client name>","phase":"<optional phase/milestone name, e.g. 'phase 1'>"}
   e.g. "fetch phase 1 invoice for zenspace" -> {"intent":"get_invoice","client":"zenspace","phase":"phase 1"}

4) client_info — a status snapshot for ONE named client ("tell me about Azadi", "how is Zenspace doing", "status of client X", "X progress", "how many weeks for X"). Returns contract/collected/progress/weeks.
   {"intent":"client_info","client":"<client name>"}
   e.g. "how's azadi records doing" -> {"intent":"client_info","client":"azadi records"}

5) add_reminder — a PERSONAL reminder the user wants pinged back to them ("remind me to text xyz tomorrow", "remind me to call the accountant in 2 hours", "remind me at 6pm to send the invoice", "reminder next monday 9am: follow up with Aurix"). Only creates a personal reminder; touches no business data.
   {"intent":"add_reminder","text":"<what to be reminded of, imperative — e.g. 'text xyz'>","remindAt":"<absolute ISO 8601 datetime WITH the +05:30 IST offset>"}
   Resolve the time in IST relative to the CURRENT INSTANT above. If only a date is given (no clock time), use 09:00 IST. remindAt MUST be in the future and look like "2026-07-23T09:00:00+05:30".
   e.g. (today 2026-07-22) "remind me to text xyz tomorrow" -> {"intent":"add_reminder","text":"text xyz","remindAt":"2026-07-23T09:00:00+05:30"}

6) summary — financial summary / totals / P&L:  {"intent":"summary"}
7) balance — petty-cash who-owes-who:  {"intent":"balance"}
8) offtrack — which sub-projects are behind schedule:  {"intent":"offtrack"}

9) query — ANY other READ-ONLY data question the fixed intents above do not cover (e.g. "which clients are off track", "total collected from Azadi", "list prospects in proposal stage", "how many invoices this month", "top 5 expenses this year"). Return a SINGLE read-only SELECT.
   {"intent":"query","sql":"<one SELECT statement>","explain":"<one-line human summary of what it fetches>"}
   sql rules: exactly ONE statement; must start with SELECT (or WITH ... SELECT); NO semicolons; NO INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE/GRANT/REVOKE/COPY/CALL/MERGE/VACUUM or any write/DDL; ALWAYS add a LIMIT (<=200); use ILIKE '%name%' for fuzzy name matching. Money is per-row in each row's own currency column (mostly INR) — do NOT convert currencies. A client's collected revenue = SUM of that client's client_subprojects.collected_revenue.

DATABASE SCHEMA (Postgres):
- clients(id uuid, name text, industry text, address text, email text, currency text, kickoff_date date, completed bool, completed_on date, archived bool, created_at timestamptz)
- client_subprojects(id uuid, client_id uuid -> clients.id, name text, accrued_revenue numeric, collected_revenue numeric, progress int, due_date date, phases jsonb [{id,name,date,amount,cost}], created_at timestamptz)
- petty_cash(id uuid, payer text ['Vansh'|'Russhil'], purpose text, amount numeric, currency text, spent_on date)
- company_expenses(id uuid, category text, vendor text, description text, amount numeric, currency text, incurred_on date, recurring bool)
- prospects(id uuid, name text, company text, email text, phone text, source text, stage text ['new'|'contacted'|'qualified'|'proposal'|'won'|'lost'], est_value numeric, currency text, created_at timestamptz)
- invoices(id uuid, seq int, invoice_no text, client_id uuid, client_name text, phase_id text, description text, amount numeric, currency text, issue_date date)
- team_members(id uuid, name text, role text, email text, active bool)
- petty_cash_settlements(id uuid, from_person text, to_person text, amount numeric, currency text, settled_on date)

SEMANTICS: "projects" = clients and/or client_subprojects — there is NO table named "projects". A client is completed when clients.completed = true (yet-to-be-completed = completed = false and archived = false). A sub-project is "done" when its progress >= 100. Only reference tables/columns listed above.

10) unknown — an unsupported write (see above), or a message that is neither an action nor answerable by a SELECT:  {"intent":"unknown"}
Prefer "query" over "unknown" for anything that READS data; use "unknown" for any write that is not petty cash or expense.`;
}

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

function str(v: unknown): string | undefined {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : undefined;
  }
  if (typeof v === "number") return String(v);
  return undefined;
}

function num(v: unknown): number | undefined {
  const n = typeof v === "string" ? Number(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Coerce whatever the model returned into a valid BotIntent, dropping anything
// that doesn't have the fields a given intent requires.
function toIntent(raw: unknown): BotIntent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  switch (o.intent) {
    case "add_petty_cash": {
      const payer = str(o.payer);
      const amount = num(o.amount);
      const purpose = str(o.purpose);
      if (!payer || amount === undefined || !purpose) return { intent: "unknown" };
      return { intent: "add_petty_cash", payer, amount, purpose, date: str(o.date) };
    }
    case "add_expense": {
      const amount = num(o.amount);
      if (amount === undefined) return { intent: "unknown" };
      return {
        intent: "add_expense",
        category: str(o.category) ?? "misc",
        vendor: str(o.vendor),
        amount,
        date: str(o.date),
      };
    }
    case "get_invoice": {
      const client = str(o.client);
      if (!client) return { intent: "unknown" };
      return { intent: "get_invoice", client, phase: str(o.phase) };
    }
    case "client_info": {
      const client = str(o.client);
      if (!client) return { intent: "unknown" };
      return { intent: "client_info", client };
    }
    case "add_reminder": {
      const text = str(o.text);
      const remindAt = str(o.remindAt);
      if (!text || !remindAt) return { intent: "unknown" };
      return { intent: "add_reminder", text, remindAt };
    }
    case "query": {
      const sql = str(o.sql);
      if (!sql) return { intent: "unknown" };
      // The server re-validates and the DB function is read-only; here we only
      // ensure the shape is well-formed.
      return { intent: "query", sql, explain: str(o.explain) ?? "" };
    }
    case "summary":
      return { intent: "summary" };
    case "balance":
      return { intent: "balance" };
    case "offtrack":
      return { intent: "offtrack" };
    case "unknown":
      return { intent: "unknown" };
    default:
      return { intent: "unknown" };
  }
}

export async function parseIntent(
  text: string,
  now: string = new Date().toISOString()
): Promise<BotIntent | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text.trim()) return null;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction(now) }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    if (!res.ok) {
      console.error(`[gemini] generateContent failed with status ${res.status}`);
      return null;
    }
    const data = (await res.json()) as GeminiResponse;
    const out = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!out) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(out);
    } catch {
      return null;
    }
    return toIntent(parsed);
  } catch (e) {
    console.error("[gemini] request error:", e instanceof Error ? e.message : "unknown");
    return null;
  }
}
