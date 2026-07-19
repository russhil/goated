"use client";

import { useEffect, useState } from "react";
import {
  inputClass,
  labelClass,
  phasesTotal,
  phasesCostTotal,
  type Phase,
} from "@/lib/hq";
import { createInvoice } from "./invoice-actions";

const empty: Phase = { name: "", date: "", amount: 0, cost: 0 };

export default function PhasesEditor({
  value,
  onChange,
  clientId,
  subprojectId,
  currency,
}: {
  value: Phase[];
  onChange: (phases: Phase[]) => void;
  clientId: string;
  subprojectId: string | null;
  currency: string;
}) {
  // Amounts and costs are string-backed so a field can be emptied (and decimals
  // typed) while the parent keeps the canonical numeric Phase[]. Rebuilt from
  // value only when rows are added/removed/reset (length change), never mid-typing.
  const [rawAmount, setRawAmount] = useState<string[]>(() =>
    value.map((p) => (p.amount ? String(p.amount) : ""))
  );
  const [rawCost, setRawCost] = useState<string[]>(() =>
    value.map((p) => (p.cost ? String(p.cost) : ""))
  );
  useEffect(() => {
    setRawAmount((prev) =>
      prev.length === value.length
        ? prev
        : value.map((p) => (p.amount ? String(p.amount) : ""))
    );
    setRawCost((prev) =>
      prev.length === value.length
        ? prev
        : value.map((p) => (p.cost ? String(p.cost) : ""))
    );
  }, [value]);

  const update = (i: number, patch: Partial<Phase>) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setAmount = (i: number, text: string) => {
    setRawAmount((r) => r.map((v, idx) => (idx === i ? text : v)));
    onChange(value.map((p, idx) => (idx === i ? { ...p, amount: Number(text) || 0 } : p)));
  };
  const setCost = (i: number, text: string) => {
    setRawCost((r) => r.map((v, idx) => (idx === i ? text : v)));
    onChange(value.map((p, idx) => (idx === i ? { ...p, cost: Number(text) || 0 } : p)));
  };

  // A date change re-orders rows ascending (blank dates sink to the end, same
  // rule as sortPhases). The string buffers are permuted the same way so each
  // stays attached to its phase.
  const setDate = (i: number, text: string) => {
    const next = value.map((p, idx) => (idx === i ? { ...p, date: text } : p));
    const order = next
      .map((_, idx) => idx)
      .sort((a, b) => {
        const da = next[a].date || "";
        const db = next[b].date || "";
        if (!da) return db ? 1 : 0;
        if (!db) return -1;
        return da.localeCompare(db);
      });
    onChange(order.map((idx) => next[idx]));
    setRawAmount((r) => order.map((idx) => r[idx] ?? ""));
    setRawCost((r) => order.map((idx) => r[idx] ?? ""));
  };

  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  // Generating an invoice is an explicit, per-row action — awaiting the server
  // round-trip here is fine (unlike the create-flow). Track the busy row so its
  // button shows "…" and errors surface next to that specific row.
  const [invoiceBusy, setInvoiceBusy] = useState<number | null>(null);
  const [invoiceError, setInvoiceError] = useState<Record<number, string>>({});
  const generateInvoice = async (i: number) => {
    const phase = value[i];
    setInvoiceError((e) => ({ ...e, [i]: "" }));
    setInvoiceBusy(i);
    const res = await createInvoice({
      clientId,
      subprojectId,
      description: phase.name || "Professional services",
      amount: Number(phase.amount) || 0,
      currency,
      issueDate: phase.date || "",
    });
    setInvoiceBusy(null);
    if (res.ok && res.id) window.open("/admin/hq/invoice/" + res.id, "_blank");
    else setInvoiceError((e) => ({ ...e, [i]: res.error || "invoice failed" }));
  };

  const total = phasesTotal(value);
  const costTotal = phasesCostTotal(value);

  return (
    <div className="mb-3">
      <label className={labelClass}>// phases</label>
      <div className="flex flex-col gap-2">
        {value.map((p, i) => (
          <div key={i}>
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
              <input
                className={inputClass}
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="phase (e.g. Discovery)"
              />
              <input
                type="date"
                className={inputClass}
                value={p.date}
                onChange={(e) => setDate(i, e.target.value)}
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className={inputClass}
                value={rawAmount[i] ?? ""}
                onChange={(e) => setAmount(i, e.target.value)}
                placeholder="amount"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className={inputClass}
                value={rawCost[i] ?? ""}
                onChange={(e) => setCost(i, e.target.value)}
                placeholder="cost"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateInvoice(i)}
                  disabled={!clientId || (Number(p.amount) || 0) <= 0 || invoiceBusy !== null}
                  className="font-mono text-coral hover:underline text-[11px] disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {invoiceBusy === i ? "…" : "⤓ invoice"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="font-mono text-[11px] text-red-600 hover:underline px-1"
                >
                  ×
                </button>
              </div>
            </div>
            {invoiceError[i] && (
              <span className="font-mono text-[11px] text-red-600">{`// ${invoiceError[i]}`}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button type="button" onClick={add} className="font-mono text-[11px] text-coral hover:underline">
          + add phase
        </button>
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-[11px] text-muted">
            {`// payments: ₹${total.toLocaleString("en-IN")}`}
          </span>
          <span className="font-mono text-[11px] text-muted">
            {`// cost: ₹${costTotal.toLocaleString("en-IN")}`}
          </span>
        </div>
      </div>
    </div>
  );
}
