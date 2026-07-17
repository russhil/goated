import { createAdminClient } from "@/lib/supabase/admin";
import { type Client, type Subproject, type TeamMember } from "@/lib/hq";
import TeamManager from "./team-manager";
import ClientRow from "./client-row";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { archived?: string };
}) {
  const showArchived = searchParams.archived === "1";
  const admin = createAdminClient();

  const [{ data: team }, { data: clients }, { data: subs }] = await Promise.all([
    admin.from("team_members").select("*").order("name", { ascending: true }),
    admin
      .from("clients")
      .select("*")
      .eq("archived", showArchived)
      .order("created_at", { ascending: false }),
    admin
      .from("client_subprojects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const subsByClient = new Map<string, Subproject[]>();
  for (const s of (subs ?? []) as Subproject[]) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const teamList = (team ?? []) as TeamMember[];
  const clientList = (clients ?? []) as Client[];

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <TeamManager team={teamList} />

      <div className="flex items-center gap-2 mb-6">
        <a
          href="/admin/hq/clients"
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
            !showArchived ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
          }`}
        >
          active
        </a>
        <a
          href="/admin/hq/clients?archived=1"
          className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
            showArchived ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
          }`}
        >
          archived
        </a>
      </div>

      {!showArchived && (
        <div className="mb-8">
          <p className="font-serif text-xl text-dark mb-4">Add a client</p>
          <ul className="flex flex-col gap-4">
            <ClientRow team={teamList} />
          </ul>
        </div>
      )}

      <ul className="flex flex-col gap-4">
        {clientList.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            subprojects={subsByClient.get(c.id) ?? []}
            team={teamList}
          />
        ))}
      </ul>

      {clientList.length === 0 && (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center mt-4">
          <p className="font-serif text-2xl text-dark mb-3">
            {showArchived ? "No archived clients." : "No clients yet."}
          </p>
          <p className="font-sans text-muted">
            {showArchived ? "Archived clients show up here." : "Add your first client above."}
          </p>
        </div>
      )}
    </section>
  );
}
