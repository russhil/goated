import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AutoSignInTrigger from "@/components/AutoSignInTrigger";
import { getPublishedJobs } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Explore Jobs",
  description:
    "Open roles at GOATED. — apply by showing us what you've actually built. Custom software & AI agency in Mumbai.",
  alternates: { canonical: "https://goatedd.tech/explore" },
};

export default async function ExplorePage() {
  const supabase = createClient();
  const [{
    data: { user },
  }, jobs] = await Promise.all([supabase.auth.getUser(), getPublishedJobs()]);

  return (
    <main>
      <Suspense fallback={null}>
        <AutoSignInTrigger />
      </Suspense>
      <Navbar />

      <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="section-label">{"// open roles"}</div>
        <h1
          className="font-serif text-dark leading-[1.1] mb-6"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
        >
          Build with us.
        </h1>
        <p className="font-sans text-muted text-lg max-w-2xl mb-4">
          We don&apos;t do CV-screens. Pick a role, do the task, and send us the link.
          If your work resonates, we&apos;ll be in touch within a week.
        </p>
        {user ? (
          <p className="font-mono text-xs text-muted/70">
            {"// signed in as "}
            <span className="text-dark">{user.email}</span>
            {" · "}
            <Link href="/explore/dashboard" className="text-coral hover:underline">
              view your applications
            </Link>
          </p>
        ) : (
          <p className="font-mono text-xs text-muted/70">
            {"// sign in (top-right) to apply or track your applications."}
          </p>
        )}
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1400px] mx-auto">
        {jobs.length === 0 ? (
          <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
            <p className="font-serif text-2xl text-dark mb-3">No open roles right now.</p>
            <p className="font-sans text-muted">Check back soon — we&apos;re always on the lookout.</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Link
              key={job.slug}
              href={`/explore/${job.slug}`}
              className="group block border border-dark/10 hover:border-coral rounded-2xl p-8 md:p-10 card-lift bg-white"
            >
              <div className="flex items-start justify-between mb-6">
                <span className="font-mono text-xs text-coral uppercase tracking-widest">
                  {"// open role"}
                </span>
                <span className="font-mono text-xs text-muted">{"// apply"}</span>
              </div>
              <h2
                className="font-serif text-dark leading-tight mb-3"
                style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
              >
                {job.title}
              </h2>
              <p className="font-serif italic text-coral text-lg mb-5">
                {job.tagline}
              </p>
              <p className="font-sans text-muted mb-8 leading-relaxed">
                {job.description}
              </p>
              <span className="inline-flex items-center gap-2 font-sans text-sm text-dark group-hover:text-coral transition-colors">
                Read the task
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
        )}
      </section>
    </main>
  );
}
