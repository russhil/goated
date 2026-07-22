"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireManage, revalidateHq, type Result } from "../guard";
import {
  CURRENCIES,
  subProgress,
  phasesTotal,
  sortPhases,
  type Credential,
  type Phase,
} from "@/lib/hq";

export type ClientInput = {
  name: string;
  industry: string;
  currency: string;
  github_url: string;
  db_url: string;
  live_url: string;
  description: string;
  address: string;
  email: string;
  story: string;
  color: string;
  kickoff_date: string; // "yyyy-mm-dd" or ""
  completed: boolean;
  completed_on: string; // "yyyy-mm-dd" or ""
  credentials: Credential[];
  contributor_ids: string[];
};

function sanitizeCredentials(creds: Credential[]): Credential[] {
  if (!Array.isArray(creds)) return [];
  return creds
    .map((c) => ({
      label: (c.label || "").trim(),
      username: (c.username || "").trim(),
      secret: (c.secret || "").trim(),
      note: (c.note || "").trim(),
    }))
    .filter((c) => c.label || c.username || c.secret || c.note);
}

function clientPayload(input: ClientInput) {
  return {
    name: input.name.trim(),
    industry: (input.industry || "").trim() || null,
    currency: CURRENCIES.includes(input.currency as (typeof CURRENCIES)[number])
      ? input.currency
      : "INR",
    github_url: (input.github_url || "").trim() || null,
    db_url: (input.db_url || "").trim() || null,
    live_url: (input.live_url || "").trim() || null,
    description: (input.description || "").trim() || null,
    address: (input.address || "").trim() || null,
    email: (input.email || "").trim() || null,
    story: (input.story || "").trim() || null,
    color: /^#[0-9a-fA-F]{6}$/.test((input.color || "").trim()) ? input.color.trim() : null,
    kickoff_date: input.kickoff_date ? input.kickoff_date : null,
    completed: Boolean(input.completed),
    completed_on: input.completed && input.completed_on ? input.completed_on : null,
    credentials: sanitizeCredentials(input.credentials),
    contributor_ids: Array.isArray(input.contributor_ids)
      ? input.contributor_ids.filter(Boolean)
      : [],
  };
}

export async function createClient(input: ClientInput): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateClient(id: string, input: ClientInput): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function archiveClient(id: string): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: true }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function restoreClient(id: string): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

// Hard delete: removes PDFs from storage, cascades sub-projects.
export async function deleteClient(id: string): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("nda_path, contract_path")
    .eq("id", id)
    .single();
  const paths = [client?.nda_path, client?.contract_path].filter(Boolean) as string[];
  if (paths.length) await admin.storage.from("client-docs").remove(paths);

  const { error } = await admin.from("clients").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export type SubprojectInput = {
  name: string;
  description: string;
  accrued_revenue: number;
  phases: Phase[];
  due_date: string; // "yyyy-mm-dd" or ""
  contributor_ids: string[];
  sort_order: number;
};

function sanitizePhases(phases: Phase[]): Phase[] {
  if (!Array.isArray(phases)) return [];
  // A phase is meaningful if it's named or dated; that drops fully-empty rows.
  // Amount and cost are coerced (and clamped non-negative) so bad input can't
  // poison the totals. Stored date-ordered so downstream reads never re-sort.
  const cleaned = phases
    .map((p) => ({
      // Keep the stable id (assign one when a phase first gets saved) so an
      // invoice can be tied to this phase for its lifetime.
      id: p.id || crypto.randomUUID(),
      name: (p.name || "").trim(),
      date: (p.date || "").trim(),
      amount: Math.max(0, Number(p.amount) || 0),
      cost: Math.max(0, Number(p.cost) || 0),
    }))
    .filter((p) => p.name !== "" || p.date !== "");
  return sortPhases(cleaned);
}

function subprojectPayload(input: SubprojectInput) {
  // Progress is derived, never entered: how much of the contract is collected.
  const accrued_revenue = Math.max(0, Number(input.accrued_revenue) || 0);
  const phases = sanitizePhases(input.phases);
  // collected_revenue is no longer entered — it's the sum of the phase amounts.
  const collected_revenue = phasesTotal(phases);
  return {
    name: input.name.trim(),
    description: (input.description || "").trim() || null,
    accrued_revenue,
    collected_revenue,
    phases,
    progress: subProgress({ accrued_revenue, collected_revenue }),
    due_date: input.due_date || null,
    contributor_ids: Array.isArray(input.contributor_ids)
      ? input.contributor_ids.filter(Boolean)
      : [],
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
  };
}

export async function createSubproject(
  clientId: string,
  input: SubprojectInput
): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const payload = subprojectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("client_subprojects")
    .insert({ client_id: clientId, ...payload });
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateSubproject(
  id: string,
  input: SubprojectInput
): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const payload = subprojectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteSubproject(id: string): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

const DOC_BUCKET = "client-docs";
const DOC_KINDS = ["nda", "contract"] as const;
type DocKind = (typeof DOC_KINDS)[number];
const DOC_COL: Record<DocKind, "nda_path" | "contract_path"> = {
  nda: "nda_path",
  contract: "contract_path",
};

export async function uploadClientDoc(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };

  const clientId = String(formData.get("clientId") || "");
  const kind = String(formData.get("kind") || "") as DocKind;
  const file = formData.get("file");

  if (!clientId) return { ok: false, error: "missing client" };
  if (!DOC_KINDS.includes(kind)) return { ok: false, error: "invalid kind" };
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "no file provided" };
  if (file.type !== "application/pdf") return { ok: false, error: "file must be a PDF" };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "PDF must be under 10MB" };

  const admin = createAdminClient();
  const col = DOC_COL[kind];

  // Confirm the client exists (and grab any current doc) BEFORE touching
  // storage, so a stale/malformed clientId can't leave an orphaned object.
  const { data: existing } = await admin
    .from("clients")
    .select(col)
    .eq("id", clientId)
    .maybeSingle();
  if (!existing) return { ok: false, error: "client not found" };
  const oldPath = (existing as Record<string, string | null>)[col];

  const path = `${clientId}/${kind}-${Date.now()}.pdf`;
  const { error: upErr } = await admin.storage
    .from(DOC_BUCKET)
    .upload(path, file, { contentType: "application/pdf", upsert: true });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: updErr } = await admin.from("clients").update({ [col]: path }).eq("id", clientId);
  if (updErr) return { ok: false, error: updErr.message };
  if (oldPath && oldPath !== path) await admin.storage.from(DOC_BUCKET).remove([oldPath]);

  revalidateHq();
  return { ok: true };
}

export async function getClientDocUrl(
  clientId: string,
  kind: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!DOC_KINDS.includes(kind as DocKind)) return { ok: false, error: "invalid kind" };

  const admin = createAdminClient();
  const col = DOC_COL[kind as DocKind];
  const { data: client } = await admin.from("clients").select(col).eq("id", clientId).single();
  const path = client ? (client as Record<string, string | null>)[col] : null;
  if (!path) return { ok: false, error: "no document" };

  const { data, error } = await admin.storage.from(DOC_BUCKET).createSignedUrl(path, 60);
  if (error || !data) return { ok: false, error: error?.message || "could not sign url" };
  return { ok: true, url: data.signedUrl };
}

export async function removeClientDoc(clientId: string, kind: string): Promise<Result> {
  const gate = await requireManage("clients");
  if (!gate.ok) return { ok: false, error: "forbidden" };
  if (!DOC_KINDS.includes(kind as DocKind)) return { ok: false, error: "invalid kind" };

  const admin = createAdminClient();
  const col = DOC_COL[kind as DocKind];
  const { data: client } = await admin.from("clients").select(col).eq("id", clientId).single();
  const path = client ? (client as Record<string, string | null>)[col] : null;
  if (path) await admin.storage.from(DOC_BUCKET).remove([path]);

  const { error } = await admin.from("clients").update({ [col]: null }).eq("id", clientId);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
