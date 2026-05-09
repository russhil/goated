import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";
import { JOBS } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your applications",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Closed",
};

const STATUS_TONE: Record<string, string> = {
  submitted: "bg-dark/5 text-dark",
  under_review: "bg-coral/10 text-coral",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-gray-100 text-gray-500",
};

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/explore?signin=1&next=/explore/dashboard");
  }

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main>
      <CustomCursor />
      <Navbar />

      <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6 md:px-12 max-w-[1100px] mx-auto">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="section-label">{"// your dashboard"}</div>
            <h1
              className="font-serif text-dark leading-[1.1]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
            >
              Your applications.
            </h1>
            <p className="font-mono text-xs text-muted/70 mt-3">
              {"// signed in as "}
              <span className="text-dark">{user.email}</span>
            </p>
          </div>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="font-mono text-xs text-muted hover:text-coral transition-colors"
            >
              {"// sign out"}
            </button>
          </form>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto">
        {applications && applications.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {applications.map((app) => {
              const job = JOBS.find((j) => j.slug === app.role);
              return (
                <li
                  key={app.id}
                  className="border border-dark/10 rounded-2xl p-6 md:p-8 card-lift bg-white"
                >
                  <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <h2 className="font-serif text-dark text-2xl mb-1">
                        {job?.title ?? app.role}
                      </h2>
                      <p className="font-mono text-xs text-muted">
                        {"// applied "}
                        {new Date(app.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-xs px-3 py-1 rounded-full uppercase tracking-widest ${
                        STATUS_TONE[app.status] || "bg-dark/5 text-dark"
                      }`}
                    >
                      {STATUS_LABEL[app.status] || app.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    {app.github_url && (
                      <a
                        href={app.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-sm text-dark hover:text-coral transition-colors truncate link-underline"
                      >
                        GitHub: {app.github_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {app.linkedin_url && (
                      <a
                        href={app.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-sm text-dark hover:text-coral transition-colors truncate link-underline"
                      >
                        LinkedIn: {app.linkedin_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {app.instagram_url && (
                      <a
                        href={app.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-sm text-dark hover:text-coral transition-colors truncate link-underline"
                      >
                        Instagram: {app.instagram_url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>

                  {app.pitch && (
                    <p className="font-sans text-sm text-muted italic mb-4 leading-relaxed">
                      &ldquo;{app.pitch}&rdquo;
                    </p>
                  )}

                  <Link
                    href={`/explore/${app.role}`}
                    className="font-mono text-xs text-coral hover:underline"
                  >
                    {"// edit submission →"}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
            <p className="font-serif text-2xl text-dark mb-3">No applications yet.</p>
            <p className="font-sans text-muted mb-6">
              Pick a role and show us what you&apos;ve built.
            </p>
            <Link
              href="/explore"
              className="inline-block px-6 py-3 bg-dark text-white rounded-full font-sans text-sm font-medium hover:bg-coral transition-colors"
            >
              Browse open roles →
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

export const dynamic = "force-dynamic";
