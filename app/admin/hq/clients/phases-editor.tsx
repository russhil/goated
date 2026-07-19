"use client";

import { inputClass, labelClass, type Phase } from "@/lib/hq";

const empty: Phase = { name: "", date: "" };

export default function PhasesEditor({
  value,
  onChange,
}: {
  value: Phase[];
  onChange: (phases: Phase[]) => void;
}) {
  const update = (i: number, patch: Partial<Phase>) =>
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="mb-3">
      <label className={labelClass}>// phases</label>
      <div className="flex flex-col gap-2">
        {value.map((p, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
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
      <button type="button" onClick={add} className="mt-2 font-mono text-[11px] text-coral hover:underline">
        + add phase
      </button>
    </div>
  );
}
