"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireManage, revalidateHq, type Result } from "../guard";
import { logAudit } from "@/lib/audit";
import { CURRENCIES } from "@/lib/hq";
import { nextFollowupAt, sendDueFollowups } from "@/lib/followups";
import { isStage } from "./stages";

export type ProspectInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  est_value: number;
  currency: string;
  notes: string;
  reached_out: boolean;
  reached_out_on: string;
  responded: boolean;
};

function safeCurrency(c: string) {
  return CURRENCIES.includes(c as (typeof CURRENCIES)[number]) ? c : "INR";
}

// revalidateHq() already busts the shared HQ routes; the prospects page has its
// own path, so bust that too.
function revalidate() {
  revalidateHq();
  revalidatePath("/hq/prospects");
}

function validDate(s: string): string | null {
  const t = (s || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

function prospectPayload(input: ProspectInput) {
  const value = Number(input.est_value) || 0;
  const reached = !!input.reached_out;
  // If marked reached-out with no date, stamp today so the metrics have a day.
  const reachedOn = reached
    ? validDate(input.reached_out_on) ?? new Date().toISOString().slice(0, 10)
    : null;
  return {
    name: (input.name || "").trim(),
    company: (input.company || "").trim() || null,
    email: (input.email || "").trim() || null,
    phone: (input.phone || "").trim() || null,
    source: (input.source || "").trim() || null,
    stage: isStage(input.stage) ? input.stage : "new",
    est_value: value,
    currency: safeCurrency(input.currency),
    notes: (input.notes || "").trim() || null,
    reached_out: reached,
    reached_out_on: reachedOn,
    responded: !!input.responded,
  };
}

export async function createProspect(input: ProspectInput): Promise<Result> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!isStage(input.stage)) return { ok: false, error: "invalid stage" };
  const payload = prospectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };
  const admin = createAdminClient();
  // New prospects start their follow-up timer immediately.
  const { error } = await admin
    .from("prospects")
    .insert({ ...payload, next_followup_at: nextFollowupAt() });
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "create", entity: "prospect", entityLabel: payload.name, summary: `Added prospect ${payload.name}` });
  revalidate();
  return { ok: true };
}

export async function updateProspect(id: string, input: ProspectInput): Promise<Result> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!isStage(input.stage)) return { ok: false, error: "invalid stage" };
  const payload = prospectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "update", entity: "prospect", entityLabel: payload.name, summary: `Updated prospect ${payload.name}` });
  revalidate();
  return { ok: true };
}

export async function deleteProspect(id: string): Promise<Result> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "delete", entity: "prospect", summary: "Deleted a prospect" });
  revalidate();
  return { ok: true };
}

// Quick single-field move for the kanban ◀/▶ buttons and the list's inline select.
export async function updateProspectStage(id: string, stage: string): Promise<Result> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!isStage(stage)) return { ok: false, error: "invalid stage" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").update({ stage }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "update", entity: "prospect", summary: `Moved a prospect to ${stage}` });
  revalidate();
  return { ok: true };
}

// Fired by the in-app follow-up ticker when a card's timer hits zero: sends the
// due-follow-up nudge over Telegram and bumps the timers. Idempotent — a second
// call finds nothing due because the first one already moved the rows forward.
export async function triggerDueFollowups(): Promise<Result & { count?: number }> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const { count } = await sendDueFollowups();
  if (count > 0) revalidate();
  return { ok: true, count };
}

// "✓ followed up" on a card: reset this prospect's timer to the next cadence
// without waiting for (or sending) a reminder.
export async function markFollowedUp(id: string): Promise<Result> {
  const gate = await requireManage("prospects");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("prospects")
    .update({ next_followup_at: nextFollowupAt(), last_reminded_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
