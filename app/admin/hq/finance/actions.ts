"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq, type Result } from "../guard";
import { CURRENCIES, EXPENSE_CATEGORIES } from "@/lib/hq";

function safeCurrency(c: string) {
  return CURRENCIES.includes(c as (typeof CURRENCIES)[number]) ? c : "INR";
}

export type PettyCashInput = {
  paid_by_id: string;
  purpose: string;
  amount: number;
  currency: string;
  spent_on: string;
};

function pettyPayload(input: PettyCashInput) {
  return {
    paid_by_id: input.paid_by_id || null,
    purpose: input.purpose.trim(),
    amount: Number.isFinite(input.amount) ? input.amount : 0,
    currency: safeCurrency(input.currency),
    spent_on: input.spent_on,
  };
}

export async function createPettyCash(input: PettyCashInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = pettyPayload(input);
  if (!payload.purpose) return { ok: false, error: "purpose is required" };
  if (!payload.spent_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updatePettyCash(id: string, input: PettyCashInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = pettyPayload(input);
  if (!payload.purpose) return { ok: false, error: "purpose is required" };
  if (!payload.spent_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deletePettyCash(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("petty_cash").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export type ExpenseInput = {
  category: string;
  vendor: string;
  description: string;
  amount: number;
  currency: string;
  incurred_on: string;
  recurring: boolean;
  recurring_period: string;
};

function expensePayload(input: ExpenseInput) {
  return {
    category: EXPENSE_CATEGORIES.includes(
      input.category as (typeof EXPENSE_CATEGORIES)[number]
    )
      ? input.category
      : "misc",
    vendor: (input.vendor || "").trim() || null,
    description: (input.description || "").trim() || null,
    amount: Number.isFinite(input.amount) ? input.amount : 0,
    currency: safeCurrency(input.currency),
    incurred_on: input.incurred_on,
    recurring: Boolean(input.recurring),
    recurring_period: input.recurring ? input.recurring_period || "monthly" : null,
  };
}

export async function createExpense(input: ExpenseInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = expensePayload(input);
  if (!payload.incurred_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").insert(payload);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const payload = expensePayload(input);
  if (!payload.incurred_on) return { ok: false, error: "date is required" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").update(payload).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}

export async function deleteExpense(id: string): Promise<Result> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();
  const { error } = await admin.from("company_expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateHq();
  return { ok: true };
}
