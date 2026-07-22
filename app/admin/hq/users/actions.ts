"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getHqUsers } from "@/lib/hq-data";
import {
  normalizePermissions,
  OWNER_FALLBACK,
  type Permissions,
} from "@/lib/hq-perms";
import { requireUsersAdmin, revalidateHq, type Result } from "../guard";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Owners (by flag or the hard-coded fallback) are protected — they can't be
// edited, deactivated, or removed through this panel.
async function isProtected(email: string): Promise<boolean> {
  const e = email.toLowerCase();
  if (OWNER_FALLBACK.includes(e)) return true;
  const users = await getHqUsers();
  return users.some((u) => u.email.toLowerCase() === e && u.is_owner);
}

export async function saveHqUser(input: {
  email: string;
  name: string;
  permissions: Permissions;
}): Promise<Result> {
  const gate = await requireUsersAdmin();
  if (!gate.ok) return { ok: false, error: "forbidden" };

  const email = (input.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "enter a valid email" };
  if (await isProtected(email)) {
    return { ok: false, error: "that email is an owner (full access, can't be edited here)" };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("hq_users").upsert(
    {
      email,
      name: (input.name || "").trim() || null,
      permissions: normalizePermissions(input.permissions),
      active: true,
    },
    { onConflict: "email" }
  );
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function setHqUserActive(id: string, active: boolean): Promise<Result> {
  const gate = await requireUsersAdmin();
  if (!gate.ok) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();
  const { data: row } = await admin.from("hq_users").select("email").eq("id", id).maybeSingle();
  if (row && (await isProtected((row as { email: string }).email))) {
    return { ok: false, error: "owners can't be deactivated" };
  }
  const { error } = await admin.from("hq_users").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteHqUser(id: string): Promise<Result> {
  const gate = await requireUsersAdmin();
  if (!gate.ok) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();
  const { data: row } = await admin.from("hq_users").select("email").eq("id", id).maybeSingle();
  if (row && (await isProtected((row as { email: string }).email))) {
    return { ok: false, error: "owners can't be removed" };
  }
  const { error } = await admin.from("hq_users").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
