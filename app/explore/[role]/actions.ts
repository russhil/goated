"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getJob, type JobRole } from "@/lib/jobs";
import { checkRateLimit } from "@/lib/rate-limit";

type ApplyState = { ok: boolean; error?: string };

const APPLY_MAX = 10;       // max submissions per user
const APPLY_WINDOW = 3600;  // per hour (sec)

export async function applyToRole(
  role: JobRole,
  formData: FormData
): Promise<ApplyState> {
  const job = getJob(role);
  if (!job) return { ok: false, error: "Unknown role" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/explore?signin=1&next=${encodeURIComponent(`/explore/${role}`)}`);
  }

  // Rate limit: don't let one user spam the table.
  const limit = await checkRateLimit({
    userId: user.id,
    action: "apply",
    max: APPLY_MAX,
    windowSec: APPLY_WINDOW,
  });
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many submissions. Try again in ~${Math.ceil(limit.retryAfterSec / 60)} minutes.`,
    };
  }

  const payload: Record<string, string | null> = {
    user_id: user.id,
    email: user.email ?? "",
    role,
    full_name: (formData.get("full_name") as string) || null,
    github_url: (formData.get("github_url") as string) || null,
    linkedin_url: (formData.get("linkedin_url") as string) || null,
    instagram_url: (formData.get("instagram_url") as string) || null,
    pitch: (formData.get("pitch") as string) || null,
  };

  for (const field of job.fields) {
    if (field.required && !payload[field.key]) {
      return { ok: false, error: `${field.label} is required.` };
    }
  }

  const { error } = await supabase
    .from("applications")
    .upsert(payload, { onConflict: "user_id,role" });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/explore/dashboard");
  revalidatePath(`/explore/${role}`);
  return { ok: true };
}
