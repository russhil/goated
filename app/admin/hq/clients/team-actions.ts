"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";

export type TeamMemberInput = {
  name: string;
  role: string;
  email: string;
  active: boolean;
};

function memberPayload(input: TeamMemberInput) {
  return {
    name: input.name.trim(),
    role: (input.role || "").trim() || null,
    email: (input.email || "").trim() || null,
    active: Boolean(input.active),
  };
}

export async function createTeamMember(input: TeamMemberInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = memberPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("team_members").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateTeamMember(
  id: string,
  input: TeamMemberInput
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = memberPayload(input);
  if (!payload.name) return { ok: false, error: "name is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("team_members").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

// Deleting a member scrubs their id from every contributor_ids array.
// petty_cash.paid_by_id clears automatically via ON DELETE SET NULL.
export async function deleteTeamMember(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();

  const { data: clients } = await admin
    .from("clients")
    .select("id, contributor_ids")
    .contains("contributor_ids", [id]);
  for (const c of clients ?? []) {
    await admin
      .from("clients")
      .update({
        contributor_ids: (c.contributor_ids as string[]).filter((x) => x !== id),
      })
      .eq("id", c.id);
  }

  const { data: subs } = await admin
    .from("client_subprojects")
    .select("id, contributor_ids")
    .contains("contributor_ids", [id]);
  for (const s of subs ?? []) {
    await admin
      .from("client_subprojects")
      .update({
        contributor_ids: (s.contributor_ids as string[]).filter((x) => x !== id),
      })
      .eq("id", s.id);
  }

  const { error } = await admin.from("team_members").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
