"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/hq";
import PettyCashRow, { type PettyCash } from "./petty-cash-row";
import SettlementRow, { type Settlement } from "./settlement-row";
import { computeBalances, type Balance } from "./splitwise";
import { createSettlement } from "./actions";

// Full petty-cash detail: the settle-up balance per currency, the entries
// ledger (with an add row), and the settlement history.
export default function PettyCashPanel({
  entries,
  settlements,
}: {
  entries: PettyCash[];
  settlements: Settlement[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const balances = computeBalances(entries, settlements);

  const settleUp = (b: Balance) => {
    if (!b.debtor || !b.creditor) return;
    const from = b.debtor;
    const to = b.creditor;
    setError("");
    startTransition(async () => {
      const res = await createSettlement({
        from_person: from,
        to_person: to,
        amount: Math.round(b.amount * 100) / 100,
        currency: b.currency,
        settled_on: new Date().toISOString().slice(0, 10),
      });
      if (!res.ok) setError(res.error || "settle failed");
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Balance + settle up */}
      <div>
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// balance"}</p>
        <div className="flex flex-col gap-2">
          {balances.map((b) => (
            <div
              key={b.currency}
              className="flex items-center justify-between gap-3 rounded-xl border border-dark/10 bg-light/40 px-4 py-3"
            >
              <div className="font-sans text-sm">
                {b.debtor ? (
                  <span className="text-dark">
                    <span className="font-medium">{b.debtor}</span> owes{" "}
                    <span className="font-medium">{b.creditor}</span>{" "}
                    <span className="font-medium text-coral">{formatMoney(b.amount, b.currency)}</span>
                  </span>
                ) : (
                  <span className="text-muted">settled up · {b.currency}</span>
                )}
              </div>
              {b.debtor && (
                <button
                  onClick={() => settleUp(b)}
                  disabled={pending}
                  className="px-3 py-1.5 bg-dark text-white text-xs rounded-full hover:bg-coral transition-colors disabled:opacity-40 shrink-0"
                >
                  settle up
                </button>
              )}
            </div>
          ))}
          {balances.length === 0 && (
            <p className="font-sans text-sm text-muted">No petty-cash entries yet.</p>
          )}
        </div>
        {error && <p className="font-mono text-[11px] text-red-600 mt-2">{`// ${error}`}</p>}
      </div>

      {/* Entries ledger */}
      <div>
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// entries"}</p>
        <div className="flex flex-col gap-3">
          {entries.map((p) => (
            <PettyCashRow key={p.id} entry={p} />
          ))}
          <div className="pt-2 border-t border-dark/10">
            <PettyCashRow />
          </div>
        </div>
      </div>

      {/* Settlement history */}
      <div>
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">{"// settlement history"}</p>
        <div className="flex flex-col divide-y divide-dark/5">
          {settlements.map((s) => (
            <SettlementRow key={s.id} settlement={s} />
          ))}
          {settlements.length === 0 && (
            <p className="font-sans text-sm text-muted">No settlements recorded.</p>
          )}
        </div>
      </div>
    </div>
  );
}
