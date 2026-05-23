"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

const APP_STATUSES = ["submitted", "under_review", "accepted", "rejected"] as const;
const INQUIRY_STATUSES = ["new", "replied", "archived"] as const;
const BOOKING_STATUSES = ["pending", "booked", "no_show", "archived"] as const;

type Result = { ok: boolean; error?: string };

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return { admin: false as const };
  }
  return { admin: true as const, user };
}

export async function updateApplication(
  id: string,
  status: string,
  notes: string
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  if (!APP_STATUSES.includes(status as (typeof APP_STATUSES)[number])) {
    return { ok: false, error: "invalid status" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("applications")
    .update({ status, admin_notes: notes || null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/explore/dashboard");
  return { ok: true };
}

export async function updateInquiry(
  id: string,
  status: string,
  notes: string
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  if (!INQUIRY_STATUSES.includes(status as (typeof INQUIRY_STATUSES)[number])) {
    return { ok: false, error: "invalid status" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("contact_submissions")
    .update({ status, admin_notes: notes || null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateBookingInquiry(
  id: string,
  status: string,
  notes: string
): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  if (!BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    return { ok: false, error: "invalid status" };
  }

  const admin = createAdminClient();
  // Stamp booked_at when a row first transitions to "booked" so the timestamp
  // reflects when we marked it, not when the prospect first submitted.
  const { data: existing } = await admin
    .from("booking_inquiries")
    .select("status, booked_at")
    .eq("id", id)
    .single();

  const update: Record<string, unknown> = {
    status,
    admin_notes: notes || null,
  };
  if (status === "booked" && existing?.status !== "booked" && !existing?.booked_at) {
    update.booked_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("booking_inquiries")
    .update(update)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

// ============================================================================
// Jobs CRUD
// ============================================================================

const JOB_FIELD_KEYS = [
  "github_url",
  "linkedin_url",
  "instagram_url",
  "pitch",
] as const;
const JOB_FIELD_TYPES = ["url", "text", "textarea"] as const;

export type JobFieldInput = {
  key: string;
  label: string;
  placeholder: string;
  type: string;
  required: boolean;
};

export type JobInput = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  task_heading: string;
  task_body: string;
  fields: JobFieldInput[];
  published: boolean;
  sort_order: number;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeFields(fields: JobFieldInput[]): JobFieldInput[] {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((f) => JOB_FIELD_KEYS.includes(f.key as (typeof JOB_FIELD_KEYS)[number]))
    .map((f) => ({
      key: f.key,
      label: (f.label || "").trim(),
      placeholder: (f.placeholder || "").trim(),
      type: JOB_FIELD_TYPES.includes(f.type as (typeof JOB_FIELD_TYPES)[number])
        ? f.type
        : "text",
      required: Boolean(f.required),
    }));
}

function jobPayload(input: JobInput) {
  return {
    slug: slugify(input.slug || input.title),
    title: input.title.trim(),
    tagline: (input.tagline || "").trim(),
    description: (input.description || "").trim(),
    task_heading: (input.task_heading || "").trim(),
    task_body: (input.task_body || "").trim(),
    fields: sanitizeFields(input.fields),
    published: Boolean(input.published),
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
  };
}

function revalidateJob(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/explore");
  revalidatePath(`/explore/${slug}`);
}

export async function createJob(input: JobInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const payload = jobPayload(input);
  if (!payload.title) return { ok: false, error: "title is required" };
  if (!payload.slug) return { ok: false, error: "slug is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("jobs").insert(payload);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "a job with that slug already exists" };
    return { ok: false, error: error.message };
  }

  revalidateJob(payload.slug);
  return { ok: true };
}

export async function updateJob(id: string, input: JobInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const payload = jobPayload(input);
  if (!payload.title) return { ok: false, error: "title is required" };
  if (!payload.slug) return { ok: false, error: "slug is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("jobs").update(payload).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "a job with that slug already exists" };
    return { ok: false, error: error.message };
  }

  revalidateJob(payload.slug);
  return { ok: true };
}

export async function deleteJob(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();
  const { error } = await admin.from("jobs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/explore");
  return { ok: true };
}

// ============================================================================
// Case studies CRUD
// ============================================================================

const CS_CATEGORIES = ["client", "ai", "tools"] as const;
const CS_STATUSES = ["live", "building"] as const;
const CASE_STUDY_BUCKET = "case-studies";

export type CaseStudyInput = {
  slug: string;
  category: string;
  tags: string[];
  status: string;
  title: string;
  subtitle: string;
  client: string;
  year: string;
  description: string;
  stat: string;
  problem: string;
  built: string;
  result: string;
  result_stat: string;
  image_url: string;
  link: string;
  published: boolean;
  sort_order: number;
};

function caseStudyPayload(input: CaseStudyInput) {
  return {
    slug: slugify(input.slug || input.title),
    category: CS_CATEGORIES.includes(input.category as (typeof CS_CATEGORIES)[number])
      ? input.category
      : "client",
    tags: Array.isArray(input.tags)
      ? input.tags.map((t) => t.trim()).filter(Boolean)
      : [],
    status: CS_STATUSES.includes(input.status as (typeof CS_STATUSES)[number])
      ? input.status
      : "live",
    title: input.title.trim(),
    subtitle: (input.subtitle || "").trim(),
    client: (input.client || "").trim(),
    year: (input.year || "").trim(),
    description: (input.description || "").trim(),
    stat: (input.stat || "").trim(),
    problem: (input.problem || "").trim(),
    built: (input.built || "").trim(),
    result: (input.result || "").trim(),
    result_stat: (input.result_stat || "").trim(),
    image_url: (input.image_url || "").trim() || null,
    link: (input.link || "").trim() || null,
    published: Boolean(input.published),
    sort_order: Number.isFinite(input.sort_order) ? input.sort_order : 0,
  };
}

function revalidateCaseStudy(slug: string) {
  revalidatePath("/admin");
  revalidatePath("/portfolio");
  revalidatePath(`/portfolio/${slug}`);
}

export async function createCaseStudy(input: CaseStudyInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const payload = caseStudyPayload(input);
  if (!payload.title) return { ok: false, error: "title is required" };
  if (!payload.slug) return { ok: false, error: "slug is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("case_studies").insert(payload);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "a case study with that slug already exists" };
    return { ok: false, error: error.message };
  }

  revalidateCaseStudy(payload.slug);
  return { ok: true };
}

export async function updateCaseStudy(id: string, input: CaseStudyInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const payload = caseStudyPayload(input);
  if (!payload.title) return { ok: false, error: "title is required" };
  if (!payload.slug) return { ok: false, error: "slug is required" };

  const admin = createAdminClient();
  const { error } = await admin.from("case_studies").update(payload).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "a case study with that slug already exists" };
    return { ok: false, error: error.message };
  }

  revalidateCaseStudy(payload.slug);
  return { ok: true };
}

export async function deleteCaseStudy(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const admin = createAdminClient();
  const { error } = await admin.from("case_studies").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function uploadCaseStudyImage(
  formData: FormData
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "no file provided" };
  }
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "file must be an image" };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, error: "image must be under 8MB" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(CASE_STUDY_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(CASE_STUDY_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
