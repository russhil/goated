import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";
import { getJobBySlug } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";
import ApplyForm from "./apply-form";

type Props = { params: { role: string } };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJobBySlug(params.role);
  if (!job) return { title: "Role not found" };
  return {
    title: `${job.title} — Open role`,
    description: job.description,
    alternates: { canonical: `https://goatedd.tech/explore/${job.slug}` },
  };
}

export default async function RolePage({ params }: Props) {
  const job = await getJobBySlug(params.role);
  if (!job) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/explore?signin=1&next=${encodeURIComponent(`/explore/${params.role}`)}`);
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("status, github_url, linkedin_url, instagram_url, pitch, full_name")
    .eq("user_id", user.id)
    .eq("role", job.slug)
    .maybeSingle();

  return (
    <main>
      <CustomCursor />
      <Navbar />

      <section className="pt-32 pb-8 md:pt-40 md:pb-12 px-6 md:px-12 max-w-[1100px] mx-auto">
        <Link
          href="/explore"
          className="font-mono text-xs text-muted hover:text-dark transition-colors inline-flex items-center gap-1 mb-8"
        >
          <span>←</span> back to all roles
        </Link>
        <div className="section-label">{"// open role"}</div>
        <h1
          className="font-serif text-dark leading-[1.1] mb-3"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)" }}
        >
          {job.title}
        </h1>
        <p className="font-serif italic text-coral text-xl md:text-2xl mb-8">
          {job.tagline}
        </p>
        <p className="font-sans text-muted text-lg max-w-2xl leading-relaxed">
          {job.description}
        </p>
      </section>

      <section className="px-6 md:px-12 pb-12 md:pb-16 max-w-[1100px] mx-auto">
        <div className="border-l-2 border-coral pl-6 md:pl-8 my-12">
          <p className="font-mono text-xs text-coral uppercase tracking-widest mb-2">
            {"// the task"}
          </p>
          <h2 className="font-serif text-dark text-2xl md:text-3xl mb-4">
            {job.task.heading}
          </h2>
          <p className="font-sans text-muted leading-relaxed">{job.task.body}</p>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-24 md:pb-32 max-w-[1100px] mx-auto">
        <ApplyForm
          job={job}
          existing={existing ?? null}
          userEmail={user.email ?? ""}
        />
      </section>
    </main>
  );
}
