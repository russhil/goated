import { createPublicClient } from "@/lib/supabase/public";

// A job slug. Jobs are dynamic (stored in public.jobs), so this is just a string.
export type JobRole = string;

export type JobFieldKey = "github_url" | "linkedin_url" | "instagram_url" | "pitch";

export type JobField = {
  key: JobFieldKey;
  label: string;
  placeholder: string;
  type: "url" | "text" | "textarea";
  required: boolean;
};

export type Job = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  task: {
    heading: string;
    body: string;
  };
  fields: JobField[];
};

type JobRow = {
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  task_heading: string | null;
  task_body: string | null;
  fields: JobField[] | null;
};

const JOB_COLUMNS =
  "slug, title, tagline, description, task_heading, task_body, fields";

function rowToJob(row: JobRow): Job {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    task: { heading: row.task_heading ?? "", body: row.task_body ?? "" },
    fields: Array.isArray(row.fields) ? row.fields : [],
  };
}

// Published roles for the public /explore pages, in display order.
export async function getPublishedJobs(): Promise<Job[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => rowToJob(r as JobRow));
}

// A single published role by slug, or undefined if missing/unpublished.
export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("jobs")
    .select(JOB_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? rowToJob(data as JobRow) : undefined;
}
