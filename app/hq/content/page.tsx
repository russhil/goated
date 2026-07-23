import { getContentAll } from "@/lib/hq-data";
import { canView, canManage } from "@/lib/hq-perms";
import { requireUser } from "../guard";
import { type ContentItem } from "./content-vocab";
import ContentCalendar from "./content-calendar";
import ContentList from "./content-list";
import NewContentDrawer from "./new-content-drawer";

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
  const items = (await getContentAll()) as unknown as ContentItem[];

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1200px] mx-auto pt-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <a href="/hq/content?view=calendar" className={pillCls(view === "calendar")}>
            calendar
          </a>
          <a href="/hq/content?view=list" className={pillCls(view === "list")}>
            list
          </a>
        </div>
        {canManageContent && <NewContentDrawer />}
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
        <ContentCalendar items={items} canManage={canManageContent} />
      ) : (
        <ContentList items={items} canManage={canManageContent} />
      )}
    </section>
  );
}
