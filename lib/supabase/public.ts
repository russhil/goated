import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cookieless, sessionless anon client for reading public content (jobs,
// case studies) from server components, generateStaticParams, the sitemap,
// and edge OG-image routes. RLS limits anon reads to published rows, so this
// is safe to use anywhere a public read is needed without a request context.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
