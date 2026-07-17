"use client";

import { useState, useTransition } from "react";
import { CURRENCIES, inputClass, type TeamMember } from "@/lib/hq";
import {
  createPettyCash,
  updatePettyCash,
  deletePettyCash,
  type PettyCashInput,
} from "./actions";

export type PettyCash = {
  id: string;
  paid_by_id: string | null;
  purpose: string;
  amount: number;
  currency: string;
  spent_on: string;
};

export default function PettyCashRow({
  entry,
  team,
}: {
  entry?: PettyCash;
  team: TeamMember[];
}) {
  const isNew = !entry;
  const [paidById, setPaidById] = useState(entry?.paid_by_id ?? "");
  const [purpose, setPurpose] = useState(entry?.purpose ?? "");
  const [amount, setAmount] = useState(entry?.amount ?? 0);
  const [currency, setCurrency] = useState(entry?.currency ?? "INR");
  const [spentOn, setSpentOn] = useState(entry?.spent_on ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): PettyCashInput => ({
    paid_by_id: paidById,
    purpose,
    amount: Number(amount) || 0,
    currency,
    spent_on: spentOn,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createPettyCash(build())
        : await updatePettyCash(entry!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setPaidById("");
        setPurpose("");
        setAmount(0);
        setCurrency("INR");
        setSpentOn("");
      }
    });
  };

  const remove = () => {
    if (!entry) return;
    if (!window.confirm("Delete this petty-cash entry?")) return;
    startTransition(async () => {
      const res = await deletePettyCash(entry.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_1fr_0.8fr_1fr_auto] gap-2 items-center">
      <select className={inputClass} value={paidById} onChange={(e) => setPaidById(e.target.value)}>
        <option value="">who paid…</option>
        {team.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <input className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="for what" />
      <input type="number" className={inputClass} value={amount} onChange={(e) => setAmount(Number(e.target.value))} placeholder="amount" />
      <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <input type="date" className={inputClass} value={spentOn} onChange={(e) => setSpentOn(e.target.value)} />
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={pending || !purpose.trim() || !spentOn}
          className="px-3 py-1.5 bg-dark text-white text-xs rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {isNew ? "Add" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            ×
          </button>
        )}
      </div>
      {error && <span className="font-mono text-[11px] text-red-600 col-span-full">{`// ${error}`}</span>}
    </div>
  );
}
