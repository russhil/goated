import { createAdminClient } from "@/lib/supabase/admin";
import {
  rollup,
  healthColor,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  type Client,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import TeamManager from "./team-manager";
import NewClientDrawer from "./new-client-drawer";

export const dynamic = "force-dynamic";

// Shared column template so the header and every row line up exactly.
const COLS = "14px minmax(150px,1.6fr) 1fr 1fr 1fr 1fr 64px 96px";

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

      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
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
        {!showArchived && <NewClientDrawer team={teamList} />}
      </div>

      {clientList.length > 0 ? (
        <div className="overflow-x-auto border border-dark/10 rounded-2xl bg-white">
          <div className="min-w-[860px]">
            {/* Header */}
            <div
              className="grid gap-4 items-center px-5 py-3 font-mono text-[10px] text-muted uppercase tracking-widest"
              style={{ gridTemplateColumns: COLS }}
            >
              <span />
              <span>Client</span>
              <span>Industry</span>
              <span className="text-right">Contract</span>
              <span className="text-right">Collected</span>
              <span className="text-right">Outstanding</span>
              <span className="text-right">Progress</span>
              <span className="text-right">Kickoff</span>
            </div>
            {/* Rows */}
            {clientList.map((c) => {
              const r = rollup(subsByClient.get(c.id) ?? []);
              const health = healthColor(r.progress, r.count);
              return (
                <a
                  key={c.id}
                  href={`/admin/hq/clients/${c.id}`}
                  className="grid gap-4 items-center px-5 py-4 border-t border-dark/10 hover:bg-dark/[0.02] transition-colors"
                  style={{ gridTemplateColumns: COLS }}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${HEALTH_DOT[health]}`} title={HEALTH_LABEL[health]} />
                  <span className="font-serif text-base text-dark truncate">{c.name}</span>
                  <span className="font-mono text-[11px] text-muted uppercase tracking-widest truncate">
                    {c.industry || "—"}
                  </span>
                  <span className="text-right font-sans text-sm text-dark">{formatMoney(r.totalContract, c.currency)}</span>
                  <span className="text-right font-sans text-sm text-dark">{formatMoney(r.collected, c.currency)}</span>
                  <span className="text-right font-sans text-sm text-coral">{formatMoney(r.outstanding, c.currency)}</span>
                  <span className="text-right font-mono text-xs text-dark">{r.progress}%</span>
                  <span className="text-right font-mono text-[11px] text-muted">{c.kickoff_date || "—"}</span>
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
          <p className="font-serif text-2xl text-dark mb-3">
            {showArchived ? "No archived clients." : "No clients yet."}
          </p>
          <p className="font-sans text-muted">
            {showArchived ? "Archived clients show up here." : "Use “+ New client” to add your first one."}
          </p>
        </div>
      )}
    </section>
  );
}
