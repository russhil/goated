"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";
import { CURRENCIES } from "@/lib/hq";
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
};

function safeCurrency(c: string) {
  return CURRENCIES.includes(c as (typeof CURRENCIES)[number]) ? c : "INR";
}

// revalidateHq() already busts the shared HQ routes; the prospects page has its
// own path, so bust that too.
function revalidate() {
  revalidateHq();
  revalidatePath("/admin/hq/prospects");
}

function prospectPayload(input: ProspectInput) {
  const value = Number(input.est_value) || 0;
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
  };
}

export async function createProspect(input: ProspectInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!isStage(input.stage)) return { ok: false, error: "invalid stage" };
  const payload = prospectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateProspect(id: string, input: ProspectInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!isStage(input.stage)) return { ok: false, error: "invalid stage" };
  const payload = prospectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteProspect(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

// Quick single-field move for the kanban ◀/▶ buttons and the list's inline select.
export async function updateProspectStage(id: string, stage: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!isStage(stage)) return { ok: false, error: "invalid stage" };
  const admin = createAdminClient();
  const { error } = await admin.from("prospects").update({ stage }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
