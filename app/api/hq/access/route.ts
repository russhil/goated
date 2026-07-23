// Tells the (client) Navbar whether the signed-in user may see the Client HQ /
// Admin links in the account dropdown. HQ membership lives in the DB (hq_users),
// so the client can't check it directly — this route resolves it from the
// session. Returns {member,admin}; both false when signed out.
import { createClient } from "@/lib/supabase/server";
import { resolveHqUser } from "@/lib/hq-data";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ member: false, admin: false });

  const resolved = await resolveHqUser(user.email);
  return Response.json({ member: !!resolved, admin: isAdmin(user.email) });
}
