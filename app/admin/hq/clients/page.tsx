import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamMember } from "@/lib/hq";
import TeamManager from "./team-manager";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <TeamManager team={(team ?? []) as TeamMember[]} />
      <p className="font-mono text-xs text-muted">{"// client cards — coming in Task 5"}</p>
    </section>
  );
}
