// Shared server-side auth + permission guard + revalidation for /admin/hq.
// NOT a "use server" file — it exports sync helpers and types too.
import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveHqUser, HQ_TAG } from "@/lib/hq-data";
import {
  canManage,
  canManageUsers,
  canSeeFinancials,
  type Permissions,
  type Section,
} from "@/lib/hq-perms";

export type Result = { ok: boolean; error?: string };

export type UserGate =
  | { ok: true; email: string; isOwner: boolean; perms: Permissions; userId: string }
  | { ok: false; reason: "unauth" | "forbidden"; email: string | null };

// Membership gate: is this a signed-in HQ member, and what can they do?
export async function requireUser(): Promise<UserGate> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauth", email: null };

  const resolved = await resolveHqUser(user.email);
  if (!resolved) return { ok: false, reason: "forbidden", email: user.email ?? null };

  return {
    ok: true,
    email: resolved.email,
    isOwner: resolved.isOwner,
    perms: resolved.perms,
    userId: user.id,
  };
}

// Manage-level gate for a section's mutating server actions.
export async function requireManage(section: Section): Promise<Result> {
  const g = await requireUser();
  if (!g.ok || !canManage(g.perms, section)) return { ok: false, error: "forbidden" };
  return { ok: true };
}

// Anything that reveals money (invoice PDFs, etc.).
export async function requireFinancials(): Promise<Result> {
  const g = await requireUser();
  if (!g.ok || !canSeeFinancials(g.perms)) return { ok: false, error: "forbidden" };
  return { ok: true };
}

// The user-management panel.
export async function requireUsersAdmin(): Promise<Result> {
  const g = await requireUser();
  if (!g.ok || !canManageUsers(g.perms)) return { ok: false, error: "forbidden" };
  return { ok: true };
}

export function revalidateHq() {
  // Bust the cached data loaders (lib/hq-data) so reads refresh after a write.
  revalidateTag(HQ_TAG);
  revalidatePath("/admin/hq");
  revalidatePath("/admin/hq/clients");
  revalidatePath("/admin/hq/prospects");
  revalidatePath("/admin/hq/finance");
  revalidatePath("/admin/hq/users");
}
