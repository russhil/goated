import {
  rollup,
  healthColor,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  type Subproject,
} from "@/lib/hq";
import { getClientsAll, getSubprojectsAll, getTeamAll } from "@/lib/hq-data";
import TeamManager from "./team-manager";
import NewClientDrawer from "./new-client-drawer";
import ClientsFilterBar from "./clients-filter-bar";
import RegenerateInvoicesButton from "./regenerate-invoices-button";

export const dynamic = "force-dynamic";

// Shared column template so the header and every row line up exactly.
const COLS = "14px minmax(150px,1.6fr) 1fr 1fr 1fr 1fr 64px 96px";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: {
    archived?: string;
    industry?: string;
    currency?: string;
    health?: string;
    contributor?: string;
    sort?: string;
    dir?: string;
  };
}) {
  const showArchived = searchParams.archived === "1";
  const industryFilter = searchParams.industry ?? "";
  const currencyFilter = searchParams.currency ?? "";
  const healthFilter = searchParams.health ?? "";
  const contributorFilter = searchParams.contributor ?? "";
  const sortKey = searchParams.sort ?? "created";
  const sortDir = searchParams.dir === "asc" ? "asc" : "desc";

  const [teamList, clientsAll, subsAll] = await Promise.all([
    getTeamAll(),
    getClientsAll(),
    getSubprojectsAll(),
  ]);

  const subsByClient = new Map<string, Subproject[]>();
  for (const s of subsAll) {
    const arr = subsByClient.get(s.client_id) ?? [];
    arr.push(s);
    subsByClient.set(s.client_id, arr);
  }

  const clientList = clientsAll.filter((c) => Boolean(c.archived) === showArchived);

  // Per-member active-project count for the roster (over non-archived clients;
  // a member counts once per client they touch at the client or sub-project level).
  const projectCounts: Record<string, number> = {};
  for (const c of clientsAll) {
    if (c.archived) continue;
    const ids = new Set<string>(c.contributor_ids ?? []);
    for (const sp of subsByClient.get(c.id) ?? []) {
      for (const id of sp.contributor_ids ?? []) ids.add(id);
    }
    ids.forEach((id) => {
      projectCounts[id] = (projectCounts[id] ?? 0) + 1;
    });
  }

  // Distinct industries for the filter dropdown, from the full set so options
  // never vanish under an active filter.
  const industries = Array.from(
    new Set(clientList.map((c) => c.industry).filter((x): x is string => Boolean(x)))
  ).sort();

  const rows = clientList.map((c) => {
    const r = rollup(subsByClient.get(c.id) ?? [], c.kickoff_date);
    return { c, r, health: healthColor(r.progress, r.count, r.offTrack) };
  });

  const filteredRows = rows.filter(({ c, health }) => {
    if (industryFilter && (c.industry || "") !== industryFilter) return false;
    if (currencyFilter && c.currency !== currencyFilter) return false;
    if (contributorFilter && !(c.contributor_ids ?? []).includes(contributorFilter)) return false;
    if (healthFilter && health !== healthFilter) return false;
    return true;
  });

  const dirMul = sortDir === "asc" ? 1 : -1;
  const sortedRows = [...filteredRows].sort((a, b) => {
    switch (sortKey) {
      case "name":
        return dirMul * a.c.name.localeCompare(b.c.name);
      case "contract":
        return dirMul * (a.r.totalContract - b.r.totalContract);
      case "collected":
        return dirMul * (a.r.collected - b.r.collected);
      case "outstanding":
        return dirMul * (a.r.outstanding - b.r.outstanding);
      case "progress":
        return dirMul * (a.r.progress - b.r.progress);
      case "kickoff":
        return dirMul * (a.c.kickoff_date || "").localeCompare(b.c.kickoff_date || "");
      default:
        return dirMul * (a.c.created_at || "").localeCompare(b.c.created_at || "");
    }
  });

  const hasFilters = Boolean(
    industryFilter || currencyFilter || healthFilter || contributorFilter
  );

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <TeamManager team={teamList} projectCounts={projectCounts} />

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
        <div className="flex items-center gap-2 flex-wrap">
          <RegenerateInvoicesButton />
          {!showArchived && <NewClientDrawer team={teamList} />}
        </div>
      </div>

      <ClientsFilterBar
        industries={industries}
        team={teamList}
        resultCount={sortedRows.length}
      />

      {sortedRows.length > 0 ? (
        <div className="overflow-x-auto border border-dark/10 rounded-2xl bg-white">
          <div className="min-w-[860px]">
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
            {sortedRows.map(({ c, r, health }) => (
              <a
                key={c.id}
                href={`/admin/hq/clients/${c.id}`}
                className="grid gap-4 items-center px-5 py-4 border-t border-dark/10 hover:bg-dark/[0.02] transition-colors"
                style={{ gridTemplateColumns: COLS }}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${HEALTH_DOT[health]}`} title={HEALTH_LABEL[health]} />
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-serif text-base text-dark truncate">{c.name}</span>
                  {r.offTrack && (
                    <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-red-600 bg-red-500/10 border border-red-500/20 rounded-full px-1.5 py-0.5">
                      ⚑ off track
                    </span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-muted uppercase tracking-widest truncate">
                  {c.industry || "—"}
                </span>
                <span className="text-right font-sans text-sm text-dark">{formatMoney(r.totalContract, c.currency)}</span>
                <span className="text-right font-sans text-sm text-dark">{formatMoney(r.collected, c.currency)}</span>
                <span className="text-right font-sans text-sm text-coral">{formatMoney(r.outstanding, c.currency)}</span>
                <span className="text-right font-mono text-xs text-dark">{r.progress}%</span>
                <span className="text-right font-mono text-[11px] text-muted">{c.kickoff_date || "—"}</span>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
          <p className="font-serif text-2xl text-dark mb-3">
            {hasFilters
              ? "No clients match these filters."
              : showArchived
              ? "No archived clients."
              : "No clients yet."}
          </p>
          <p className="font-sans text-muted">
            {hasFilters
              ? "Try clearing a filter above."
              : showArchived
              ? "Archived clients show up here."
              : "Use “+ New client” to add your first one."}
          </p>
        </div>
      )}
    </section>
  );
}
