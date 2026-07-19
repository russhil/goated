"use client";

import { useEffect, useState } from "react";
import { inputClass, labelClass, paymentsTotal, type Payment } from "@/lib/hq";

const empty: Payment = { date: "", amount: 0 };

export default function PaymentsEditor({
  value,
  onChange,
}: {
  value: Payment[];
  onChange: (payments: Payment[]) => void;
}) {
  // Amounts are string-backed so a field can be emptied (and decimals typed)
  // while the parent keeps the canonical numeric Payment[]. Rebuilt from value
  // only when rows are added/removed/reset (length change), never mid-typing.
  const [raw, setRaw] = useState<string[]>(() =>
    value.map((p) => (p.amount ? String(p.amount) : ""))
  );
  useEffect(() => {
    setRaw((prev) =>
      prev.length === value.length
        ? prev
        : value.map((p) => (p.amount ? String(p.amount) : ""))
    );
  }, [value]);

  const setDate = (i: number, date: string) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, date } : p)));
  const setAmount = (i: number, text: string) => {
    setRaw((r) => r.map((v, idx) => (idx === i ? text : v)));
    onChange(value.map((p, idx) => (idx === i ? { ...p, amount: Number(text) || 0 } : p)));
  };
  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const total = paymentsTotal(value);

  return (
    <div className="mb-3">
      <label className={labelClass}>// payments</label>
      <div className="flex flex-col gap-2">
        {value.map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <input
              type="date"
              className={inputClass}
              value={value[i].date}
              onChange={(e) => setDate(i, e.target.value)}
            />
            <input
              type="number"
              inputMode="decimal"
              className={inputClass}
              value={raw[i] ?? ""}
              onChange={(e) => setAmount(i, e.target.value)}
              placeholder="amount"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="font-mono text-[11px] text-red-600 hover:underline px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button type="button" onClick={add} className="font-mono text-[11px] text-coral hover:underline">
          + add payment
        </button>
        <span className="font-mono text-[11px] text-muted">
          {`// collected: ₹${total.toLocaleString("en-IN")}`}
        </span>
      </div>
    </div>
  );
}
