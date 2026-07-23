import { getContentAll, getContentAccounts } from "@/lib/hq-data";
import { canView, canManage } from "@/lib/hq-perms";
import { requireUser } from "../guard";
import {
  KIND_EMOJI,
  STATUS_LABEL,
  accountColor,
  istDayLabel,
  istTimeLabel,
  type ContentItem,
  type ContentAccount,
} from "./content-vocab";
import ContentMonth from "./content-month";
import ContentList from "./content-list";
import NewContentDrawer from "./new-content-drawer";
import AccountsManager from "./accounts-manager";

export const dynamic = "force-dynamic";

const pillCls = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
    active ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
  }`;

export default async function ContentPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const gate = await requireUser();
  if (!gate.ok) return null;
  const perms = gate.perms;
  if (!canView(perms, "content")) {
    return (
      <section className="px-6 md:px-12 pb-24 max-w-[900px] mx-auto pt-6">
        <p className="font-mono text-xs text-coral uppercase tracking-widest">
          {"// 403 — no access to Content"}
        </p>
      </section>
    );
  }
  const canManageContent = canManage(perms, "content");
  const view = searchParams.view === "list" ? "list" : "calendar";

  const [items, accounts] = (await Promise.all([getContentAll(), getContentAccounts()])) as [
    ContentItem[],
    ContentAccount[],
  ];
  const accById = new Map(accounts.map((a) => [a.id, a]));

  // Metrics
  const posted = items.filter((i) => i.status === "posted").length;
  const scheduled = items.filter((i) => i.status === "scheduled").length;
  const starred = items.filter((i) => i.starred);
  const perAccount = accounts
    .map((a) => ({ acc: a, count: items.filter((i) => i.account_id === a.id).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  const unassigned = items.filter((i) => !i.account_id).length;

  // Month calendar reference points (IST, passed as props so SSR/client match).
  const istToday = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const initialMonth = istToday.slice(0, 7);

  const stat = (label: string, value: string, accent?: boolean) => (
    <div
      key={label}
      className={`border rounded-2xl px-3 py-3 ${
        accent ? "border-coral/40 bg-coral/[0.04]" : "border-dark/10 bg-white"
      }`}
    >
      <p className="font-mono text-[10px] text-muted uppercase tracking-widest">{label}</p>
      <p className={`font-serif text-2xl leading-tight mt-1 ${accent ? "text-coral" : "text-dark"}`}>
        {value}
      </p>
    </div>
  );

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      {/* Dashboard */}
      <p className="section-label mb-2">// pipeline</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {stat("Vids aligned", String(items.length))}
        {stat("Posted", String(posted))}
        {stat("Scheduled", String(scheduled))}
        {stat("Star performers", String(starred.length), starred.length > 0)}
      </div>

      {/* Split per account */}
      {(perAccount.length > 0 || unassigned > 0) && (
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">split:</span>
          {perAccount.map(({ acc, count }) => (
            <span
              key={acc.id}
              className="inline-flex items-center gap-1.5 border border-dark/10 rounded-full px-2.5 py-1"
            >
              <span className="w-2 h-2 rounded-full" style={{ background: accountColor(acc) }} />
              <span className="font-sans text-xs text-dark">{acc.name}</span>
              <span className="font-mono text-[11px] text-muted">{count}</span>
            </span>
          ))}
          {unassigned > 0 && (
            <span className="inline-flex items-center gap-1.5 border border-dark/10 rounded-full px-2.5 py-1">
              <span className="w-2 h-2 rounded-full bg-dark/20" />
              <span className="font-sans text-xs text-muted">unassigned</span>
              <span className="font-mono text-[11px] text-muted">{unassigned}</span>
            </span>
          )}
        </div>
      )}

      {/* Star performers */}
      {starred.length > 0 && (
        <div className="mb-6">
          <p className="section-label mb-2">⭐ star performers</p>
          <div className="flex flex-col gap-2">
            {starred.map((i) => {
              const acc = i.account_id ? accById.get(i.account_id) : undefined;
              return (
                <div
                  key={i.id}
                  className="border border-coral/30 bg-coral/[0.03] rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap"
                >
                  <span aria-hidden>{KIND_EMOJI[i.kind] ?? "🎬"}</span>
                  <span className="font-serif text-base text-dark">{i.title}</span>
                  {acc && (
                    <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
                      {acc.name}
                    </span>
                  )}
                  {i.scheduled_at && (
                    <span className="font-mono text-[10px] text-muted">
                      {istDayLabel(i.scheduled_at)} · {istTimeLabel(i.scheduled_at)}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-coral uppercase tracking-widest ml-auto">
                    {STATUS_LABEL[i.status] ?? i.status}
                  </span>
                  {i.link && (
                    <a
                      href={i.link}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] text-dark/60 hover:text-coral hover:underline"
                    >
                      open ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accounts */}
      {canManageContent && <AccountsManager accounts={accounts} />}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <a href="/hq/content?view=calendar" className={pillCls(view === "calendar")}>
            calendar
          </a>
          <a href="/hq/content?view=list" className={pillCls(view === "list")}>
            list
          </a>
        </div>
        {canManageContent && <NewContentDrawer accounts={accounts} />}
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
          <p className="font-serif text-2xl text-dark mb-3">No content planned yet.</p>
          <p className="font-sans text-muted">
            {canManageContent
              ? "Use “+ New content” to schedule your first video or reel."
              : "Nothing scheduled yet."}
          </p>
        </div>
      ) : view === "calendar" ? (
        <ContentMonth
          items={items}
          accounts={accounts}
          canManage={canManageContent}
          initialMonth={initialMonth}
          todayKey={istToday}
        />
      ) : (
        <ContentList items={items} accounts={accounts} canManage={canManageContent} />
      )}
    </section>
  );
}
