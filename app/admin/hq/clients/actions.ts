"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";
import { CURRENCIES, type Credential } from "@/lib/hq";

export type ClientInput = {
  name: string;
  industry: string;
  currency: string;
  github_url: string;
  db_url: string;
  live_url: string;
  description: string;
  story: string;
  cost: number;
  kickoff_date: string; // "yyyy-mm-dd" or ""
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
    story: (input.story || "").trim() || null,
    cost: Number.isFinite(input.cost) ? input.cost : 0,
    kickoff_date: input.kickoff_date ? input.kickoff_date : null,
    credentials: sanitizeCredentials(input.credentials),
    contributor_ids: Array.isArray(input.contributor_ids)
      ? input.contributor_ids.filter(Boolean)
      : [],
  };
}

export async function createClient(input: ClientInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateClient(id: string, input: ClientInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = clientPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("clients").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function archiveClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: true }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function restoreClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("clients").update({ archived: false }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

// Hard delete: removes PDFs from storage, cascades sub-projects.
export async function deleteClient(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
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
  collected_revenue: number;
  progress: number;
  contributor_ids: string[];
  sort_order: number;
};

function subprojectPayload(input: SubprojectInput) {
  return {
    name: input.name.trim(),
    description: (input.description || "").trim() || null,
    accrued_revenue: Number.isFinite(input.accrued_revenue) ? input.accrued_revenue : 0,
    collected_revenue: Number.isFinite(input.collected_revenue) ? input.collected_revenue : 0,
    progress: Math.min(100, Math.max(0, Math.round(Number(input.progress) || 0))),
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
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
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
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = subprojectPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteSubproject(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("client_subprojects").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
