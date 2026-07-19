"use client";

import { useEffect, useState } from "react";
import { inputClass, labelClass, phasesTotal, type Phase } from "@/lib/hq";

const empty: Phase = { name: "", date: "", amount: 0 };

export default function PhasesEditor({
  value,
  onChange,
}: {
  value: Phase[];
  onChange: (phases: Phase[]) => void;
}) {
  // Amounts are string-backed so a field can be emptied (and decimals typed)
  // while the parent keeps the canonical numeric Phase[]. Rebuilt from value
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

  const update = (i: number, patch: Partial<Phase>) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setAmount = (i: number, text: string) => {
    setRaw((r) => r.map((v, idx) => (idx === i ? text : v)));
    onChange(value.map((p, idx) => (idx === i ? { ...p, amount: Number(text) || 0 } : p)));
  };
  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  const total = phasesTotal(value);

  return (
    <div className="mb-3">
      <label className={labelClass}>// phases</label>
      <div className="flex flex-col gap-2">
        {value.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
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
              onChange={(e) => update(i, { date: e.target.value })}
            />
            <input
              type="number"
              inputMode="decimal"
              min={0}
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
          + add phase
        </button>
        <span className="font-mono text-[11px] text-muted">
          {`// total: ₹${total.toLocaleString("en-IN")}`}
        </span>
      </div>
    </div>
  );
}
