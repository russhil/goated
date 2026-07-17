// Shared server-side guard + revalidation for /admin/hq server actions.
// NOT a "use server" file — it exports sync helpers and a type too.
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export type Result = { ok: boolean; error?: string };

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return { admin: false as const };
  }
  return { admin: true as const, user };
}

export function revalidateHq() {
  revalidatePath("/admin/hq");
  revalidatePath("/admin/hq/clients");
  revalidatePath("/admin/hq/finance");
}
