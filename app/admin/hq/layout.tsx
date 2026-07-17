import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import HqNav from "./hq-nav";

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

  return (
    <main>
      <Navbar />
      <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="section-label">{"// internal ops"}</div>
        <h1
          className="font-serif text-dark leading-[1.1] mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          Client HQ.
        </h1>
        <p className="font-mono text-xs text-muted/70 mb-6">
          {"// signed in as "}
          <span className="text-dark">{user.email}</span>
        </p>
        <HqNav />
      </section>
      {children}
    </main>
  );
}
