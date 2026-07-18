"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/hq";
import { deleteSettlement } from "./actions";

export type Settlement = {
  id: string;
  from_person: string;
  to_person: string;
  amount: number;
  currency: string;
  settled_on: string;
  created_at: string;
};

// A single recorded settlement (X paid Y) with a delete affordance. Settlements
// are only ever created via the "settle up" button, so there's no edit form.
export default function SettlementRow({ settlement }: { settlement: Settlement }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const remove = () => {
    if (!window.confirm("Delete this settlement?")) return;
    setError("");
    startTransition(async () => {
      const res = await deleteSettlement(settlement.id);
      if (!res.ok) setError(res.error || "delete failed");
      else router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm font-sans">
      <span className="text-dark">
        <span className="font-medium">{settlement.from_person}</span>
        <span className="text-muted"> paid </span>
        <span className="font-medium">{settlement.to_person}</span>{" "}
        {formatMoney(settlement.amount, settlement.currency)}
      </span>
      <span className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted">{settlement.settled_on}</span>
        <button
          onClick={remove}
          disabled={pending}
          className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
        >
          ×
        </button>
      </span>
      {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
    </div>
  );
}
