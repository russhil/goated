import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/explore/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) {
        const posthog = getPostHogClient();
        posthog.capture({
          distinctId: data.user.id,
          event: "user_authenticated",
          properties: { provider: "google", email: data.user.email },
        });
        posthog.identify({
          distinctId: data.user.id,
          properties: { email: data.user.email },
        });
        await posthog.shutdown();
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}
