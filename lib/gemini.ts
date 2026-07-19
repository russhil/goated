// Gemini-backed natural-language intent parser for the Telegram bot.
// parseIntent() maps a free-text message to ONE structured BotIntent and NEVER
// throws: if GEMINI_API_KEY is unset, the HTTP call fails, or the model returns
// something unparseable, it returns null and the caller falls back to /help.

const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type BotIntent =
  | { intent: "add_petty_cash"; payer: string; amount: number; purpose: string; date?: string }
  | { intent: "add_expense"; category: string; vendor?: string; amount: number; date?: string }
  | { intent: "add_prospect"; name: string; company?: string; stage?: string }
  | { intent: "get_invoice"; client: string; phase?: string }
  | { intent: "summary" }
  | { intent: "balance" }
  | { intent: "offtrack" }
  | { intent: "unknown" };

const SYSTEM_INSTRUCTION = `You route short internal-ops messages for a software agency's back office into ONE structured intent. Reply with STRICT JSON only — a single object, no prose, no markdown fences.

Money defaults to INR. "date" (when present) must be ISO YYYY-MM-DD; omit it if the message gives no date. Never invent values the user did not state.

Pick exactly ONE of these shapes:
- Logging a cash expense one of the two partners paid out of pocket:
  {"intent":"add_petty_cash","payer":"Vansh"|"Russhil","amount":<number>,"purpose":"<what for>","date":"YYYY-MM-DD"?}
- Logging a company/business expense (rent, salaries, subscriptions, software, marketing, travel, misc):
  {"intent":"add_expense","category":"<one of: rent|salaries|subscriptions|software|marketing|travel|misc>","vendor":"<optional>","amount":<number>,"date":"YYYY-MM-DD"?}
- Adding a sales lead / prospect:
  {"intent":"add_prospect","name":"<person>","company":"<optional>","stage":"<one of: new|contacted|qualified|proposal|won|lost>"?}
- Fetching a client's invoice PDF:
  {"intent":"get_invoice","client":"<client name>","phase":"<optional phase/milestone name>"}
- Financial summary / totals / P&L:  {"intent":"summary"}
- Petty-cash / who-owes-who balance:  {"intent":"balance"}
- Which projects are behind / off track:  {"intent":"offtrack"}
- Anything else or unclear:  {"intent":"unknown"}`;

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
    case "add_prospect": {
      const name = str(o.name);
      if (!name) return { intent: "unknown" };
      return { intent: "add_prospect", name, company: str(o.company), stage: str(o.stage) };
    }
    case "get_invoice": {
      const client = str(o.client);
      if (!client) return { intent: "unknown" };
      return { intent: "get_invoice", client, phase: str(o.phase) };
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

export async function parseIntent(text: string): Promise<BotIntent | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !text.trim()) return null;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
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
