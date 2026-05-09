import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — only use in server actions / route handlers
// that you've already auth-gated with isAdmin().
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
