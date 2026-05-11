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
