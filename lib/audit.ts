// Audit trail writer. Every HQ mutation calls logAudit() after it succeeds.
// Never throws — an audit failure must not break the underlying action.
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "archive"
  | "restore"
  | "generate"
  | "send";

export type AuditEntry = {
  actor: string; // email, or "telegram:<id>"
  action: AuditAction;
  entity: string; // client | prospect | expense | ...
  entityLabel?: string | null;
  summary: string; // human one-liner
};

export async function logAudit(e: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_log").insert({
      actor: e.actor,
      action: e.action,
      entity: e.entity,
      entity_label: e.entityLabel ?? null,
      summary: e.summary,
    });
  } catch {
    // swallow — auditing is best-effort, never blocks the mutation
  }
}
