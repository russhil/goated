import { notFound } from "next/navigation";
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
import ClientEditor from "../client-editor";
import SubprojectRow from "../subproject-row";
import SubprojectDrawer from "../subproject-drawer";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();
  const [{ data: client }, { data: subs }, { data: team }] = await Promise.all([
    admin.from("clients").select("*").eq("id", params.id).maybeSingle(),
    admin
      .from("client_subprojects")
      .select("*")
      .eq("client_id", params.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    admin.from("team_members").select("*").order("name", { ascending: true }),
  ]);

  if (!client) notFound();

  const c = client as Client;
  const subprojects = (subs ?? []) as Subproject[];
  const teamList = (team ?? []) as TeamMember[];
  const roll = rollup(subprojects);
  const health = healthColor(roll.progress, roll.count);

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1000px] mx-auto pt-6">
      <a href="/admin/hq/clients" className="font-mono text-[11px] text-muted hover:text-dark transition-colors">
        ← back to clients
      </a>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap mt-3 mb-6">
        <span className={`w-3 h-3 rounded-full ${HEALTH_DOT[health]}`} title={HEALTH_LABEL[health]} />
        <h2 className="font-serif text-dark" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>
          {c.name}
        </h2>
        {c.archived && (
          <span className="font-mono text-[10px] text-dark/60 uppercase tracking-widest border border-dark/15 rounded-full px-2 py-0.5">
            archived
          </span>
        )}
      </div>

      {/* Roll-up summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Contract" value={formatMoney(roll.totalContract, c.currency)} />
        <Stat label="Collected" value={formatMoney(roll.collected, c.currency)} />
        <Stat label="Outstanding" value={formatMoney(roll.outstanding, c.currency)} accent />
        <Stat label="Progress" value={`${roll.progress}% · ${HEALTH_LABEL[health]}`} />
      </div>

      {/* Editor */}
      <div className="border border-dark/10 rounded-2xl bg-white p-6 md:p-7 mb-8">
        <ClientEditor client={c} subprojects={subprojects} team={teamList} />
      </div>

      {/* Sub-projects */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest">
          {`// sub-projects (${roll.count})`}
        </p>
        <SubprojectDrawer clientId={c.id} team={teamList} currency={c.currency} />
      </div>

      {subprojects.length > 0 ? (
        <div className="flex flex-col gap-3">
          {subprojects.map((sp) => (
            <SubprojectRow key={sp.id} clientId={c.id} subproject={sp} team={teamList} currency={c.currency} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-dark/15 rounded-2xl p-8 text-center">
          <p className="font-sans text-muted">
            No sub-projects yet. Use “+ Add sub-project” — contract, collected, and progress all roll up from here.
          </p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-dark/10 rounded-xl bg-white p-4">
      <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-sans text-base ${accent ? "text-coral" : "text-dark"}`}>{value}</p>
    </div>
  );
}
