// Cached data loaders for the Admin HQ area.
//
// Each loader fetches a whole table through the service-role client, wrapped in
// unstable_cache under a single "hq" tag. Every HQ mutation calls revalidateHq()
// (lib guard) which now revalidates that tag, so reads stay fresh after edits
// but repeated navigations reuse the cache instead of hitting Supabase each time.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client, Subproject, TeamMember } from "@/lib/hq";
import {
  OWNER_FALLBACK,
  OWNER_PERMISSIONS,
  normalizePermissions,
  type Permissions,
} from "@/lib/hq-perms";

export const HQ_TAG = "hq";

export type HqUser = {
  id: string;
  email: string;
  name: string | null;
  permissions: Record<string, unknown>;
  is_owner: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export const getHqUsers = unstable_cache(
  async (): Promise<HqUser[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("hq_users")
      .select("*")
      .order("is_owner", { ascending: false })
      .order("created_at", { ascending: true });
    return (data ?? []) as HqUser[];
  },
  ["hq:users"],
  { tags: [HQ_TAG] }
);

export type ResolvedUser = {
  email: string;
  isOwner: boolean;
  active: boolean;
  perms: Permissions;
};

// Resolve a signed-in email to its permissions. Owners (by flag or the hard-coded
// fallback) always get full access; inactive/unknown emails resolve to null (no
// access at all). The fallback means the founders can never be locked out even
// if the table is empty.
export async function resolveHqUser(
  email: string | null | undefined
): Promise<ResolvedUser | null> {
  if (!email) return null;
  const e = email.toLowerCase();
  const ownerByFallback = OWNER_FALLBACK.includes(e);
  const users = await getHqUsers();
  const row = users.find((u) => u.email.toLowerCase() === e);

  if (row) {
    if (!row.active && !ownerByFallback) return null;
    const isOwner = row.is_owner || ownerByFallback;
    return {
      email: e,
      isOwner,
      active: true,
      perms: isOwner ? OWNER_PERMISSIONS : normalizePermissions(row.permissions),
    };
  }
  if (ownerByFallback) {
    return { email: e, isOwner: true, active: true, perms: OWNER_PERMISSIONS };
  }
  return null;
}

export const getClientsAll = unstable_cache(
  async (): Promise<Client[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    return (data ?? []) as Client[];
  },
  ["hq:clients"],
  { tags: [HQ_TAG] }
);

export const getSubprojectsAll = unstable_cache(
  async (): Promise<Subproject[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("client_subprojects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    return (data ?? []) as Subproject[];
  },
  ["hq:subprojects"],
  { tags: [HQ_TAG] }
);

export const getTeamAll = unstable_cache(
  async (): Promise<TeamMember[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("team_members")
      .select("*")
      .order("name", { ascending: true });
    return (data ?? []) as TeamMember[];
  },
  ["hq:team"],
  { tags: [HQ_TAG] }
);

export const getPettyCashAll = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("petty_cash")
      .select("*")
      .order("spent_on", { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },
  ["hq:petty_cash"],
  { tags: [HQ_TAG] }
);

export const getExpensesAll = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("company_expenses")
      .select("*")
      .order("incurred_on", { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },
  ["hq:company_expenses"],
  { tags: [HQ_TAG] }
);

export const getSettlementsAll = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("petty_cash_settlements")
      .select("*")
      .order("settled_on", { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },
  ["hq:settlements"],
  { tags: [HQ_TAG] }
);

export const getProspectsAll = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("prospects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },
  ["hq:prospects"],
  { tags: [HQ_TAG] }
);

export const getInvoicesAll = unstable_cache(
  async (): Promise<Record<string, unknown>[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("invoices")
      .select("*")
      .order("seq", { ascending: true });
    return (data ?? []) as Record<string, unknown>[];
  },
  ["hq:invoices"],
  { tags: [HQ_TAG] }
);

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entity_label: string | null;
  summary: string;
  created_at: string;
};

export const getAuditLog = unstable_cache(
  async (): Promise<AuditRow[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as AuditRow[];
  },
  ["hq:audit"],
  { tags: [HQ_TAG] }
);
