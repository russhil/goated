// Cached data loaders for the Admin HQ area.
//
// Each loader fetches a whole table through the service-role client, wrapped in
// unstable_cache under a single "hq" tag. Every HQ mutation calls revalidateHq()
// (lib guard) which now revalidates that tag, so reads stay fresh after edits
// but repeated navigations reuse the cache instead of hitting Supabase each time.
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Client, Subproject, TeamMember } from "@/lib/hq";

export const HQ_TAG = "hq";

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
