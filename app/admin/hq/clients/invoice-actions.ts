"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, revalidateHq } from "../guard";
import type { Phase } from "@/lib/hq";

const PREFIX = "GT";
const invNo = (seq: number) => `${PREFIX}${String(seq).padStart(3, "0")}`;

// Ensure every phase across all sub-projects has a stable id (assign + persist
// any that are missing), then return every DATED phase with its client context.
type PhaseRec = {
  phaseId: string;
  subprojectId: string;
  clientId: string;
  clientName: string;
  clientAddress: string | null;
  name: string;
  amount: number;
  currency: string;
  date: string;
};

async function collectDatedPhases(
  admin: ReturnType<typeof createAdminClient>
): Promise<PhaseRec[]> {
  const [{ data: subs }, { data: clients }] = await Promise.all([
    admin.from("client_subprojects").select("id, client_id, phases"),
    admin.from("clients").select("id, name, address, currency"),
  ]);
  const cmap = new Map(
    ((clients ?? []) as { id: string; name: string; address: string | null; currency: string }[]).map(
      (c) => [c.id, c]
    )
  );

  const recs: PhaseRec[] = [];
  for (const sp of (subs ?? []) as { id: string; client_id: string; phases: Phase[] | null }[]) {
    let phases = Array.isArray(sp.phases) ? sp.phases : [];
    let changed = false;
    phases = phases.map((ph) => {
      if (!ph.id) {
        changed = true;
        return { ...ph, id: crypto.randomUUID() };
      }
      return ph;
    });
    if (changed) await admin.from("client_subprojects").update({ phases }).eq("id", sp.id);

    const client = cmap.get(sp.client_id);
    for (const ph of phases) {
      if (!ph.date || !ph.id) continue;
      recs.push({
        phaseId: ph.id,
        subprojectId: sp.id,
        clientId: sp.client_id,
        clientName: client?.name ?? "",
        clientAddress: client?.address ?? null,
        name: (ph.name || "").trim() || "Professional services",
        amount: Math.max(0, Number(ph.amount) || 0),
        currency: client?.currency ?? "INR",
        date: ph.date,
      });
    }
  }
  return recs;
}

// Renumber EVERY dated phase in chronological order → GT001, GT002, ...
// Wipes existing invoices first (a deliberate "populate all" action).
export async function regenerateAllInvoices(): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
}> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  const admin = createAdminClient();

  const recs = await collectDatedPhases(admin);
  recs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.phaseId.localeCompare(b.phaseId)));

  // Clear all existing invoices (delete needs a filter; this matches every row).
  await admin.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const rows = recs.map((r, i) => ({
    seq: i + 1,
    invoice_no: invNo(i + 1),
    phase_id: r.phaseId,
    client_id: r.clientId,
    client_name: r.clientName,
    client_address: r.clientAddress,
    subproject_id: r.subprojectId,
    description: r.name,
    amount: r.amount,
    currency: r.currency,
    issue_date: r.date,
  }));

  if (rows.length) {
    const { error } = await admin.from("invoices").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidateHq();
  return { ok: true, count: rows.length };
}

export type EnsureInvoiceInput = {
  phaseId: string;
  clientId: string;
  subprojectId: string | null;
  name: string;
  amount: number;
  currency: string;
  date: string;
};

// Get (or assign) the stable invoice number for one phase. Re-running returns
// the same number; a brand-new phase appends the next number.
export async function ensureInvoiceForPhase(
  input: EnsureInvoiceInput
): Promise<{ ok: boolean; id?: string; invoiceNo?: string; error?: string }> {
  const gate = await requireAdmin();
  if (!gate.admin) return { ok: false, error: "forbidden" };
  if (!input.phaseId || !input.clientId) return { ok: false, error: "missing phase/client" };
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("invoices")
    .select("id, invoice_no")
    .eq("phase_id", input.phaseId)
    .maybeSingle();
  if (existing) {
    const e = existing as { id: string; invoice_no: string };
    return { ok: true, id: e.id, invoiceNo: e.invoice_no };
  }

  const { data: last } = await admin
    .from("invoices")
    .select("seq")
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();
  const seq = Number((last as { seq?: number } | null)?.seq ?? 0) + 1;

  const { data: client } = await admin
    .from("clients")
    .select("name, address")
    .eq("id", input.clientId)
    .maybeSingle();

  const { data: inserted, error } = await admin
    .from("invoices")
    .insert({
      seq,
      invoice_no: invNo(seq),
      phase_id: input.phaseId,
      client_id: input.clientId,
      client_name: (client as { name?: string } | null)?.name ?? "",
      client_address: (client as { address?: string | null } | null)?.address ?? null,
      subproject_id: input.subprojectId,
      description: (input.name || "").trim() || "Professional services",
      amount: Math.max(0, Number(input.amount) || 0),
      currency: input.currency || "INR",
      issue_date: input.date || new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message || "insert failed" };
  revalidateHq();
  return { ok: true, id: (inserted as { id: string }).id, invoiceNo: invNo(seq) };
}
