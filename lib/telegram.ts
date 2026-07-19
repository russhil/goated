// Thin Telegram Bot API client. Reads TELEGRAM_BOT_TOKEN from the environment on
// every call — the token is never returned, logged, or embedded in error text.
// Both helpers resolve to void and swallow transport errors (logging only a
// non-secret message) so a Telegram outage never bubbles into the webhook.

const API_BASE = "https://api.telegram.org";

function token(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

async function call(method: string, init: RequestInit): Promise<void> {
  const t = token();
  if (!t) {
    console.error("[telegram] TELEGRAM_BOT_TOKEN is not set");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/bot${t}/${method}`, init);
    if (!res.ok) {
      // Telegram returns a JSON body with description; log status only so the
      // URL (which contains the token) never lands in logs.
      console.error(`[telegram] ${method} failed with status ${res.status}`);
    }
  } catch (e) {
    console.error(`[telegram] ${method} request error:`, e instanceof Error ? e.message : "unknown");
  }
}

export async function sendMessage(chatId: number | string, text: string): Promise<void> {
  await call("sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

export async function sendDocument(
  chatId: number | string,
  filename: string,
  bytes: Uint8Array,
  caption?: string
): Promise<void> {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) {
    form.append("caption", caption);
    form.append("parse_mode", "HTML");
  }
  // Copy into a fresh ArrayBuffer so the Blob owns a clean, correctly-sized buffer.
  const buf = bytes.slice();
  form.append("document", new Blob([buf], { type: "application/pdf" }), filename);
  await call("sendDocument", { method: "POST", body: form });
}
