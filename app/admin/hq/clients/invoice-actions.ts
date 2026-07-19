"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "../guard";

export type InvoiceInput = {
  clientId: string;
  subprojectId: string | null;
  description: string;
  amount: number;
  currency: string;
  issueDate: string; // "yyyy-mm-dd" or "" (defaults to today)
};

// Last manually-issued invoice was GTJ015, so the first generated is GTJ016.
const INVOICE_BASE = 15;

export async function createInvoice(
  input: InvoiceInput
): Promise<{ ok: boolean; id?: string; invoiceNo?: string; error?: string }> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!input.clientId) return { ok: false, error: "missing client" };

  const admin = createAdminClient();
  const { data: client } = await admin
    .from("clients")
    .select("name, address")
    .eq("id", input.clientId)
    .maybeSingle();
  if (!client) return { ok: false, error: "client not found" };

  const { data: last } = await admin
    .from("invoices")
    .select("seq")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  const seq = Math.max(INVOICE_BASE, Number((last as { seq?: number } | null)?.seq ?? 0)) + 1;
  const invoiceNo = `GTJ${String(seq).padStart(3, "0")}`;
  const issueDate = input.issueDate || new Date().toISOString().slice(0, 10);

  const { data: inserted, error } = await admin
    .from("invoices")
    .insert({
      seq,
      invoice_no: invoiceNo,
      client_id: input.clientId,
      client_name: (client as { name: string }).name,
      client_address: (client as { address: string | null }).address,
      subproject_id: input.subprojectId,
      description: (input.description || "").trim() || "Professional services",
      amount: Math.max(0, Number(input.amount) || 0),
      currency: input.currency || "INR",
      issue_date: issueDate,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message || "insert failed" };
  return { ok: true, id: (inserted as { id: string }).id, invoiceNo };
}
