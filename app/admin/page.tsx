import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import AdminRow from "./admin-row";
import InquiryRow from "./inquiry-row";
import BookingRow from "./booking-row";
import JobRow, { type AdminJob } from "./job-row";
import CaseStudyRow, { type AdminCaseStudy } from "./case-study-row";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = {
  view?: string;
  role?: string;
  status?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/explore?signin=1&next=/admin");
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
            <p className="font-sans text-muted mb-2">
              Signed in as <span className="text-dark font-medium">{user.email}</span>.
            </p>
            <p className="font-sans text-muted text-sm mb-8">
              The admin allowlist only includes the founders. If this should be you,
              ask another admin to add your email to{" "}
              <code className="text-dark">ADMIN_EMAILS</code> in{" "}
              <code>.env.local</code>.
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

  const view =
    searchParams.view === "inquiries"
      ? "inquiries"
      : searchParams.view === "bookings"
        ? "bookings"
        : searchParams.view === "jobs"
          ? "jobs"
          : searchParams.view === "case-studies"
            ? "case-studies"
            : "applications";
  const admin = createAdminClient();

  return (
    <main>
      <Navbar />

      <section className="pt-32 pb-6 md:pt-40 md:pb-8 px-6 md:px-12 max-w-[1100px] mx-auto">
        <div className="section-label">{"// admin"}</div>
        <h1
          className="font-serif text-dark leading-[1.1] mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          Review submissions.
        </h1>
        <p className="font-mono text-xs text-muted/70 mb-6">
          {"// signed in as "}
          <span className="text-dark">{user.email}</span>
        </p>

        {/* Top-level view tabs */}
        <div className="flex items-center gap-2 mb-2">
          <TabPill
            href="/admin?view=applications"
            label="Job applications"
            active={view === "applications"}
          />
          <TabPill
            href="/admin?view=inquiries"
            label="Client inquiries"
            active={view === "inquiries"}
          />
          <TabPill
            href="/admin?view=bookings"
            label="Booked meetings"
            active={view === "bookings"}
          />
          <TabPill href="/admin?view=jobs" label="Jobs" active={view === "jobs"} />
          <TabPill
            href="/admin?view=case-studies"
            label="Case studies"
            active={view === "case-studies"}
          />
        </div>
      </section>

      {view === "applications" && (
        <ApplicationsView searchParams={searchParams} adminClient={admin} />
      )}
      {view === "inquiries" && (
        <InquiriesView searchParams={searchParams} adminClient={admin} />
      )}
      {view === "bookings" && (
        <BookingsView searchParams={searchParams} adminClient={admin} />
      )}
      {view === "jobs" && <JobsView adminClient={admin} />}
      {view === "case-studies" && <CaseStudiesView adminClient={admin} />}
    </main>
  );
}

async function ApplicationsView({
  searchParams,
  adminClient,
}: {
  searchParams: SearchParams;
  adminClient: ReturnType<typeof createAdminClient>;
}) {
  let query = adminClient
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (searchParams.role) query = query.eq("role", searchParams.role);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const [{ data: applications, error }, { data: jobs }] = await Promise.all([
    query,
    adminClient.from("jobs").select("slug, title").order("sort_order", { ascending: true }),
  ]);

  const roleLabel = new Map<string, string>(
    (jobs ?? []).map((j: { slug: string; title: string }) => [j.slug, j.title])
  );

  const counts = (applications ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <section className="px-6 md:px-12 pb-4 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono mb-4">
          <span className="text-muted">{applications?.length ?? 0} total</span>
          {Object.entries(counts).map(([k, v]) => (
            <span key={k} className="text-muted">
              · {k.replace("_", " ")}: <span className="text-dark">{v}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill
            href="/admin?view=applications"
            label="All"
            active={!searchParams.role && !searchParams.status}
          />
          <span className="text-muted/50 px-1">|</span>
          {(jobs ?? []).map((j: { slug: string; title: string }) => (
            <FilterPill
              key={j.slug}
              href={`/admin?view=applications&role=${j.slug}`}
              label={j.title}
              active={searchParams.role === j.slug}
            />
          ))}
          <span className="text-muted/50 px-1">|</span>
          {["submitted", "under_review", "accepted", "rejected"].map((s) => (
            <FilterPill
              key={s}
              href={`/admin?view=applications&status=${s}`}
              label={s.replace("_", " ")}
              active={searchParams.status === s}
            />
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto pt-6">
        {error && (
          <p className="font-sans text-sm text-red-600 mb-6">
            Failed to load applications: {error.message}
          </p>
        )}
        {applications && applications.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {applications.map((app) => (
              <AdminRow key={app.id} app={app} roleLabel={roleLabel.get(app.role)} />
            ))}
          </ul>
        ) : (
          <EmptyState
            heading="No applications match."
            body="Try clearing the filters or wait for new submissions."
          />
        )}
      </section>
    </>
  );
}

async function InquiriesView({
  searchParams,
  adminClient,
}: {
  searchParams: SearchParams;
  adminClient: ReturnType<typeof createAdminClient>;
}) {
  let query = adminClient
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: inquiries, error } = await query;

  const counts = (inquiries ?? []).reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <section className="px-6 md:px-12 pb-4 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono mb-4">
          <span className="text-muted">{inquiries?.length ?? 0} total</span>
          {Object.entries(counts).map(([k, v]) => (
            <span key={k} className="text-muted">
              · {k}: <span className="text-dark">{v}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill
            href="/admin?view=inquiries"
            label="All"
            active={!searchParams.status}
          />
          <span className="text-muted/50 px-1">|</span>
          {["new", "replied", "archived"].map((s) => (
            <FilterPill
              key={s}
              href={`/admin?view=inquiries&status=${s}`}
              label={s}
              active={searchParams.status === s}
            />
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto pt-6">
        {error && (
          <p className="font-sans text-sm text-red-600 mb-6">
            Failed to load inquiries: {error.message}
          </p>
        )}
        {inquiries && inquiries.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {inquiries.map((inq) => (
              <InquiryRow key={inq.id} inquiry={inq} />
            ))}
          </ul>
        ) : (
          <EmptyState
            heading="No inquiries yet."
            body="When visitors fill out the contact form on the homepage, they'll show up here."
          />
        )}
      </section>
    </>
  );
}

async function BookingsView({
  searchParams,
  adminClient,
}: {
  searchParams: SearchParams;
  adminClient: ReturnType<typeof createAdminClient>;
}) {
  let query = adminClient
    .from("booking_inquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: bookings, error } = await query;

  const counts = (bookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <section className="px-6 md:px-12 pb-4 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono mb-4">
          <span className="text-muted">{bookings?.length ?? 0} total</span>
          {Object.entries(counts).map(([k, v]) => (
            <span key={k} className="text-muted">
              · {k.replace("_", " ")}: <span className="text-dark">{v}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill
            href="/admin?view=bookings"
            label="All"
            active={!searchParams.status}
          />
          <span className="text-muted/50 px-1">|</span>
          {["pending", "booked", "no_show", "archived"].map((s) => (
            <FilterPill
              key={s}
              href={`/admin?view=bookings&status=${s}`}
              label={s.replace("_", " ")}
              active={searchParams.status === s}
            />
          ))}
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto pt-6">
        {error && (
          <p className="font-sans text-sm text-red-600 mb-6">
            Failed to load bookings: {error.message}
          </p>
        )}
        {bookings && bookings.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {bookings.map((b) => (
              <BookingRow key={b.id} inquiry={b} />
            ))}
          </ul>
        ) : (
          <EmptyState
            heading="No booking inquiries yet."
            body="When a prospect fills out the qualifier before booking a call, they'll show up here."
          />
        )}
      </section>
    </>
  );
}

async function JobsView({
  adminClient,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
}) {
  const { data: jobs, error } = await adminClient
    .from("jobs")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto pt-6">
      {error && (
        <p className="font-sans text-sm text-red-600 mb-6">
          Failed to load jobs: {error.message}
        </p>
      )}

      <p className="font-mono text-xs text-muted mb-6">
        {`// ${jobs?.length ?? 0} role${(jobs?.length ?? 0) === 1 ? "" : "s"} — published roles appear on /explore`}
      </p>

      <div className="mb-10">
        <p className="font-serif text-xl text-dark mb-4">Add a new role</p>
        <ul className="flex flex-col gap-4">
          <JobRow />
        </ul>
      </div>

      {jobs && jobs.length > 0 && (
        <>
          <p className="font-serif text-xl text-dark mb-4">Existing roles</p>
          <ul className="flex flex-col gap-4">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job as AdminJob} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

async function CaseStudiesView({
  adminClient,
}: {
  adminClient: ReturnType<typeof createAdminClient>;
}) {
  const { data: studies, error } = await adminClient
    .from("case_studies")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto pt-6">
      {error && (
        <p className="font-sans text-sm text-red-600 mb-6">
          Failed to load case studies: {error.message}
        </p>
      )}

      <p className="font-mono text-xs text-muted mb-6">
        {`// ${studies?.length ?? 0} case stud${(studies?.length ?? 0) === 1 ? "y" : "ies"} — published ones appear on /portfolio`}
      </p>

      <div className="mb-10">
        <p className="font-serif text-xl text-dark mb-4">Add a new case study</p>
        <ul className="flex flex-col gap-4">
          <CaseStudyRow />
        </ul>
      </div>

      {studies && studies.length > 0 && (
        <>
          <p className="font-serif text-xl text-dark mb-4">Existing case studies</p>
          <ul className="flex flex-col gap-4">
            {studies.map((study) => (
              <CaseStudyRow key={study.id} study={study as AdminCaseStudy} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function TabPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-full text-sm font-sans transition ${
        active
          ? "bg-dark text-white"
          : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
      }`}
    >
      {label}
    </a>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition ${
        active ? "bg-coral text-white" : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
      }`}
    >
      {label}
    </a>
  );
}

function EmptyState({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="border border-dashed border-dark/15 rounded-2xl p-12 text-center">
      <p className="font-serif text-2xl text-dark mb-3">{heading}</p>
      <p className="font-sans text-muted">{body}</p>
    </div>
  );
}
