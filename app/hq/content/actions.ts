"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireManage, revalidateHq, type Result } from "../guard";
import { logAudit } from "@/lib/audit";
import { KINDS, PLATFORMS, STATUSES, isKind, isPlatform, isStatus } from "./content-vocab";

export type ContentInput = {
  title: string;
  kind: string;
  platform: string;
  status: string;
  // Full ISO string (the form converts the datetime-local value in the browser's
  // timezone), or "" for unscheduled.
  scheduled_at: string;
  topic: string;
  notes: string;
  link: string;
};

function revalidate() {
  revalidateHq();
  revalidatePath("/hq/content");
}

function payload(input: ContentInput) {
  const raw = (input.scheduled_at || "").trim();
  const d = raw ? new Date(raw) : null;
  return {
    title: (input.title || "").trim(),
    kind: isKind(input.kind) ? input.kind : KINDS[0],
    platform: isPlatform(input.platform) ? input.platform : PLATFORMS[0],
    status: isStatus(input.status) ? input.status : STATUSES[0],
    scheduled_at: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
    topic: (input.topic || "").trim() || null,
    notes: (input.notes || "").trim() || null,
    link: (input.link || "").trim() || null,
  };
}

export async function createContent(input: ContentInput): Promise<Result> {
  const gate = await requireManage("content");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const p = payload(input);
  if (!p.title) return { ok: false, error: "title is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("content_items").insert(p);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "create", entity: "content", entityLabel: p.title, summary: `Added content "${p.title}"` });
  revalidate();
  return { ok: true };
}

export async function updateContent(id: string, input: ContentInput): Promise<Result> {
  const gate = await requireManage("content");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const p = payload(input);
  if (!p.title) return { ok: false, error: "title is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("content_items").update(p).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "update", entity: "content", entityLabel: p.title, summary: `Updated content "${p.title}"` });
  revalidate();
  return { ok: true };
}

export async function deleteContent(id: string): Promise<Result> {
  const gate = await requireManage("content");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("content_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "delete", entity: "content", summary: "Deleted a content item" });
  revalidate();
  return { ok: true };
}

// Quick status change (list inline select) without opening the full form.
export async function updateContentStatus(id: string, status: string): Promise<Result> {
  const gate = await requireManage("content");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!isStatus(status)) return { ok: false, error: "invalid status" };
  const admin = createAdminClient();
  const { error } = await admin.from("content_items").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logAudit({ actor: gate.email, action: "update", entity: "content", summary: `Moved a content item to ${status}` });
  revalidate();
  return { ok: true };
}
