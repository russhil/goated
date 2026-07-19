import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { getClientsAll, getSubprojectsAll, getProspectsAll } from "@/lib/hq-data";
import { subOffTrack } from "@/lib/hq";
import HqNav from "./hq-nav";
import { HqThemeProvider } from "./theme";
import Notifications, { type OffTrackItem, type ReachOutItem } from "./notifications";

export const metadata: Metadata = {
  title: "Client HQ",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function HqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/explore?signin=1&next=/admin/hq");
  }

  if (!isAdmin(user.email)) {
    return (
      <main>
        <Navbar />
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="font-mono text-xs text-coral uppercase tracking-widest mb-4">
              {"// 403 — not on the allowlist"}
            </p>
            <h1
              className="font-serif text-dark mb-4"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
            >
              You&apos;re signed in, but not as an admin.
            </h1>
            <p className="font-sans text-muted mb-8">
              Signed in as{" "}
              <span className="text-dark font-medium">{user.email}</span>.
            </p>
            <form action="/auth/sign-out" method="post" className="inline-block">
              <button
                type="submit"
                className="px-6 py-3 bg-dark text-white rounded-full text-sm font-medium hover:bg-coral transition-colors"
              >
                Sign out and try a different email
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const initialTheme =
    cookies().get("hq-theme")?.value === "dark" ? "dark" : "light";

  const [clients, subprojects, prospects] = await Promise.all([
    getClientsAll(),
    getSubprojectsAll(),
    getProspectsAll(),
  ]);

  const offTrackItems: OffTrackItem[] = clients
    .filter((c) => !c.archived && !c.completed)
    .flatMap((c) =>
      subprojects
        .filter((s) => s.client_id === c.id)
        .filter((s) =>
          subOffTrack(
            {
              accrued_revenue: s.accrued_revenue,
              collected_revenue: s.collected_revenue,
              due_date: s.due_date,
            },
            c.kickoff_date
          )
        )
        .map((s) => ({
          clientId: c.id,
          clientName: c.name,
          subName: s.name,
          dueDate: s.due_date,
        }))
    );

  // Weekly reach-out flag: prospects still in the "New" stage after ≥ 1 week.
  const now = Date.now();
  const reachOut: ReachOutItem[] = (
    prospects as { id: string; name: string; company: string | null; stage: string; created_at: string }[]
  )
    .filter((p) => p.stage === "new")
    .map((p) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      ageDays: Math.floor((now - new Date(p.created_at).getTime()) / 86_400_000),
    }))
    .filter((p) => Number.isFinite(p.ageDays) && p.ageDays >= 7)
    .sort((a, b) => b.ageDays - a.ageDays);

  return (
    <main>
      {/* Pre-paint: adopt the dark root class before React hydrates so the
          overscroll gutter never flashes white on a dark-theme navigation. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(document.cookie.indexOf('hq-theme=dark')>-1)document.documentElement.classList.add('hq-dark-root')}catch(e){}",
        }}
      />
      <HqThemeProvider initialTheme={initialTheme}>
        <Navbar />
        <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-12 max-w-[1200px] mx-auto">
          <div className="section-label">{"// internal ops"}</div>
          <div className="flex items-start justify-between gap-4">
            <h1
              className="font-serif text-dark leading-[1.1] mb-3"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Client HQ.
            </h1>
            <Notifications items={offTrackItems} prospects={reachOut} />
          </div>
          <p className="font-mono text-xs text-muted/70 mb-6">
            {"// signed in as "}
            <span className="text-dark">{user.email}</span>
          </p>
          <HqNav />
        </section>
        {children}
      </HqThemeProvider>
    </main>
  );
}
