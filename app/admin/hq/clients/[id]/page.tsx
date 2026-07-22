import { notFound } from "next/navigation";
import {
  rollup,
  healthColor,
  subProgress,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  type Subproject,
  type TeamMember,
  type Client,
} from "@/lib/hq";
import { getClientsAll, getSubprojectsAll, getTeamAll, getInvoicesAll } from "@/lib/hq-data";
import { canView, canManage, canSeeFinancials } from "@/lib/hq-perms";
import { requireUser } from "../../guard";
import ClientEditor from "../client-editor";
import SubprojectRow from "../subproject-row";
import SubprojectDrawer from "../subproject-drawer";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [clientsAll, subsAll, teamList, invoicesAll] = await Promise.all([
    getClientsAll(),
    getSubprojectsAll(),
    getTeamAll(),
    getInvoicesAll(),
  ]);

  const c = clientsAll.find((x) => x.id === params.id);
  if (!c) notFound();

  const gate = await requireUser();
  if (!gate.ok) return null;
  const perms = gate.perms;
  if (!canView(perms, "clients")) {
    return (
      <section className="px-6 md:px-12 pb-24 max-w-[900px] mx-auto pt-6">
        <p className="font-mono text-xs text-coral uppercase tracking-widest">
          {"// 403 — no access to Clients"}
        </p>
      </section>
    );
  }
  const canEdit = canManage(perms, "clients");
  const showMoney = canSeeFinancials(perms);

  const subprojects: Subproject[] = subsAll.filter((s) => s.client_id === params.id);

  // phase id → invoice number, so each phase row can show its stable number.
  const invoiceByPhase: Record<string, string> = {};
  for (const row of invoicesAll as { phase_id: string | null; invoice_no: string }[]) {
    if (row.phase_id) invoiceByPhase[row.phase_id] = row.invoice_no;
  }
  const roll = rollup(subprojects, c.kickoff_date);
  const health = healthColor(roll.progress, roll.count, roll.offTrack, c.completed);

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
        {!c.completed && roll.offTrack && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-red-600 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
            ⚑ {roll.offTrackCount} off track
          </span>
        )}
      </div>

      {/* Roll-up summary — money only for members who can see financials */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {showMoney && <Stat label="Contract" value={formatMoney(roll.totalContract, c.currency)} />}
        {showMoney && <Stat label="Collected" value={formatMoney(roll.collected, c.currency)} />}
        {showMoney && <Stat label="Outstanding" value={formatMoney(roll.outstanding, c.currency)} accent />}
        <Stat label="Progress" value={`${roll.progress}% · ${HEALTH_LABEL[health]}`} />
      </div>

      {canEdit ? (
        <>
          {/* Editor */}
          <div className="border border-dark/10 rounded-2xl bg-white p-6 md:p-7 mb-8">
            <ClientEditor client={c} subprojects={subprojects} team={teamList} />
          </div>

          {/* Sub-projects */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <p className="font-mono text-[11px] text-coral uppercase tracking-widest">
              {`// sub-projects (${roll.count})`}
            </p>
            <SubprojectDrawer clientId={c.id} team={teamList} currency={c.currency} kickoffDate={c.kickoff_date} />
          </div>

          {subprojects.length > 0 ? (
            <div className="flex flex-col gap-3">
              {subprojects.map((sp) => (
                <SubprojectRow key={sp.id} clientId={c.id} subproject={sp} team={teamList} currency={c.currency} kickoffDate={c.kickoff_date} invoiceByPhase={invoiceByPhase} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-dark/15 rounded-2xl p-8 text-center">
              <p className="font-sans text-muted">
                No sub-projects yet. Use “+ Add sub-project” — contract, collected, and progress all roll up from here.
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Read-only view for members without client-management rights.
              Deliberately omits money, credentials, docs, and infra links. */}
          <ReadOnlyInfo client={c} team={teamList} />
          <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-4">
            {`// sub-projects (${roll.count})`}
          </p>
          {subprojects.length > 0 ? (
            <div className="flex flex-col gap-3">
              {subprojects.map((sp) => (
                <div
                  key={sp.id}
                  className="border border-dark/10 rounded-xl bg-white px-5 py-3 flex items-center gap-4 flex-wrap"
                >
                  <span className="font-serif text-base text-dark">{sp.name}</span>
                  <span className="font-mono text-xs text-dark ml-auto">{subProgress(sp)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-muted">No sub-projects yet.</p>
          )}
        </>
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

function ReadOnlyInfo({ client, team }: { client: Client; team: TeamMember[] }) {
  const contributors = (client.contributor_ids ?? [])
    .map((id) => team.find((m) => m.id === id)?.name)
    .filter((n): n is string => Boolean(n));
  const rows: { label: string; value: string; href?: string }[] = [];
  if (client.industry) rows.push({ label: "Industry", value: client.industry });
  if (client.description) rows.push({ label: "Description", value: client.description });
  if (client.story) rows.push({ label: "Progress notes", value: client.story });
  if (client.email) rows.push({ label: "Contact", value: client.email });
  if (client.live_url) rows.push({ label: "Live", value: client.live_url, href: client.live_url });
  if (contributors.length) rows.push({ label: "Team", value: contributors.join(", ") });

  return (
    <div className="border border-dark/10 rounded-2xl bg-white p-6 md:p-7 mb-8 flex flex-col gap-3">
      {rows.length === 0 && <p className="font-sans text-muted">No details to show.</p>}
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[110px_1fr] gap-3 items-baseline">
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">{r.label}</span>
          {r.href ? (
            <a href={r.href} target="_blank" rel="noreferrer" className="font-sans text-sm text-coral hover:underline break-all">
              {r.value}
            </a>
          ) : (
            <span className="font-sans text-sm text-dark whitespace-pre-wrap">{r.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
