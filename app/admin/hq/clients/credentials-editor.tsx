"use client";

import { useState } from "react";
import { inputClass, labelClass, type Credential } from "@/lib/hq";

const empty: Credential = { label: "", username: "", secret: "", note: "" };

export default function CredentialsEditor({
  value,
  onChange,
}: {
  value: Credential[];
  onChange: (creds: Credential[]) => void;
}) {
  const [reveal, setReveal] = useState<Record<number, boolean>>({});

  const update = (i: number, patch: Partial<Credential>) =>
    onChange(value.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...value, { ...empty }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const copy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="mb-5">
      <label className={labelClass}>// credentials</label>
      <div className="flex flex-col gap-2">
        {value.map((c, i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-center">
            <input className={inputClass} value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="label (e.g. Admin panel)" />
            <input className={inputClass} value={c.username} onChange={(e) => update(i, { username: e.target.value })} placeholder="username" />
            <div className="flex items-center gap-1">
              <input
                className={inputClass}
                type={reveal[i] ? "text" : "password"}
                value={c.secret}
                onChange={(e) => update(i, { secret: e.target.value })}
                placeholder="secret"
              />
              <button type="button" onClick={() => setReveal((r) => ({ ...r, [i]: !r[i] }))} className="font-mono text-[10px] text-muted hover:text-dark px-1" title="show/hide">
                {reveal[i] ? "hide" : "show"}
              </button>
              <button type="button" onClick={() => copy(c.secret)} className="font-mono text-[10px] text-muted hover:text-dark px-1" title="copy">
                copy
              </button>
            </div>
            <input className={inputClass} value={c.note} onChange={(e) => update(i, { note: e.target.value })} placeholder="note" />
            <button type="button" onClick={() => remove(i)} className="font-mono text-[11px] text-red-600 hover:underline px-1">
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-2 font-mono text-[11px] text-coral hover:underline">
        + add credential
      </button>
    </div>
  );
}
