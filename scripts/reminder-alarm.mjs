#!/usr/bin/env node
// In-house reminder alarm — fires Telegram reminders at the exact time.
//
// This is deliberately NOT part of the Vercel deployment and uses NO Vercel
// cron. The bot webhook only parses "remind me to text xyz tomorrow" and stores
// a row in the `reminders` table; THIS process is the alarm clock: it watches
// that table and DMs you the moment each reminder is due.
//
// Run it on any always-on machine (your Mac, a Pi, a small VPS):
//   node scripts/reminder-alarm.mjs
// Reminders only fire while this is running — like any alarm, the clock has to
// be on. It reads secrets from .env.local (or the process env if already set).
//
// Needs Node 18+ (global fetch). No dependencies.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const POLL_MS = 20_000; // re-scan the table every 20s
const LOOKAHEAD_MS = 45_000; // schedule anything due within the next 45s
const scheduled = new Set(); // reminder ids already given a timer

function loadEnv() {
  const env = { ...process.env };
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env.local — rely on process.env (hosted use)
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;

if (!SUPABASE_URL || !SERVICE_KEY || !BOT_TOKEN) {
  console.error(
    "[alarm] missing env — need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TELEGRAM_BOT_TOKEN"
  );
  process.exit(1);
}

function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

async function sbFetch(path, init) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init && init.headers),
    },
  });
}

async function sendTelegram(chatId, text) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // plain text (no parse_mode) so the user's reminder text can't break formatting
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      log("[alarm] telegram sendMessage failed:", res.status);
      return false;
    }
    return true;
  } catch (e) {
    log("[alarm] telegram error:", e?.message || e);
    return false;
  }
}

async function markSent(id) {
  // conditional on sent=false so a reminder is never delivered twice
  await sbFetch(`reminders?id=eq.${id}&sent=eq.false`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ sent: true }),
  });
}

async function fire(r) {
  const ok = await sendTelegram(r.chat_id, `⏰ Reminder:\n${r.text}`);
  if (ok) {
    await markSent(r.id);
    log(`[alarm] fired reminder ${r.id} -> chat ${r.chat_id}`);
  } else {
    scheduled.delete(r.id); // let the next poll retry
  }
}

async function poll() {
  const horizon = new Date(Date.now() + LOOKAHEAD_MS).toISOString();
  try {
    const res = await sbFetch(
      `reminders?select=id,chat_id,text,remind_at&sent=eq.false&remind_at=lte.${encodeURIComponent(
        horizon
      )}&order=remind_at.asc&limit=200`
    );
    if (!res.ok) {
      log("[alarm] poll failed:", res.status);
      return;
    }
    const rows = await res.json();
    for (const r of rows) {
      if (scheduled.has(r.id)) continue;
      scheduled.add(r.id);
      const delay = Math.max(0, new Date(r.remind_at).getTime() - Date.now());
      setTimeout(() => fire(r), delay);
      log(`[alarm] scheduled reminder ${r.id} in ${Math.round(delay / 1000)}s`);
    }
  } catch (e) {
    log("[alarm] poll error:", e?.message || e);
  }
}

log("[alarm] reminder alarm started — watching for due reminders");
poll();
setInterval(poll, POLL_MS);
