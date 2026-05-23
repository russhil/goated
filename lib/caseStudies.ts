import { createPublicClient } from "@/lib/supabase/public";

export type CaseStudy = {
  id: string; // = DB slug
  category: "client" | "ai" | "tools";
  tags: string[];
  status: "live" | "building";
  title: string;
  subtitle: string;
  client: string;
  year: string;
  description: string;
  stat: string;
  problem: string;
  built: string;
  result: string;
  resultStat: string;
  image: string; // = DB image_url (/public path or Supabase Storage URL)
  link?: string;
};

type CaseStudyRow = {
  slug: string;
  category: string;
  tags: string[] | null;
  status: string;
  title: string;
  subtitle: string | null;
  client: string | null;
  year: string | null;
  description: string | null;
  stat: string | null;
  problem: string | null;
  built: string | null;
  result: string | null;
  result_stat: string | null;
  image_url: string | null;
  link: string | null;
};

const CS_COLUMNS =
  "slug, category, tags, status, title, subtitle, client, year, description, stat, problem, built, result, result_stat, image_url, link";

function rowToCaseStudy(row: CaseStudyRow): CaseStudy {
  return {
    id: row.slug,
    category: row.category as CaseStudy["category"],
    tags: row.tags ?? [],
    status: row.status as CaseStudy["status"],
    title: row.title,
    subtitle: row.subtitle ?? "",
    client: row.client ?? "",
    year: row.year ?? "",
    description: row.description ?? "",
    stat: row.stat ?? "",
    problem: row.problem ?? "",
    built: row.built ?? "",
    result: row.result ?? "",
    resultStat: row.result_stat ?? "",
    image: row.image_url ?? "",
    link: row.link ?? undefined,
  };
}

// All published case studies for /portfolio, in display order.
export async function getPublishedCaseStudies(): Promise<CaseStudy[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("case_studies")
    .select(CS_COLUMNS)
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => rowToCaseStudy(r as CaseStudyRow));
}

// A single published case study by slug, or undefined if missing/unpublished.
export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | undefined> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("case_studies")
    .select(CS_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? rowToCaseStudy(data as CaseStudyRow) : undefined;
}
