"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateAllInvoices } from "./invoice-actions";

// Renumbers every dated phase chronologically (GT001, GT002, …). A deliberate,
// destructive re-sync, so it's gated behind a confirm.
export default function RegenerateInvoicesButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState("");

  const run = () => {
    if (
      !window.confirm(
        "Renumber all invoices in date order (GT001, GT002, …)? Existing numbers are reassigned."
      )
    )
      return;
    setError("");
    setDone(null);
    startTransition(async () => {
      const res = await regenerateAllInvoices();
      if (!res.ok) {
        setError(res.error || "failed");
        return;
      }
      setDone(res.count ?? 0);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="bg-dark/[0.04] text-dark/70 hover:bg-dark/10 rounded-full px-4 py-2 text-sm disabled:opacity-40"
      >
        {pending ? "…" : "⟳ Renumber invoices"}
      </button>
      {done !== null && (
        <span className="font-mono text-[11px] text-muted">{`// ${done} invoices`}</span>
      )}
      {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
    </div>
  );
}
