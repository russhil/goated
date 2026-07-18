"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES, inputClass, labelClass } from "@/lib/hq";
import { STAGES, STAGE_LABELS, type Prospect } from "./stages";
import {
  createProspect,
  updateProspect,
  deleteProspect,
  type ProspectInput,
} from "./actions";

// Create/edit form shared by the "new prospect" drawer and the edit drawers on
// the board + list. est_value is string-backed so the field can be emptied
// (the "can't delete the leading 0" glitch), coerced to a number only on save.
export default function ProspectForm({
  prospect,
  onSaved,
}: {
  prospect?: Prospect;
  onSaved?: () => void;
}) {
  const isNew = !prospect;
  const router = useRouter();

  const [name, setName] = useState(prospect?.name ?? "");
  const [company, setCompany] = useState(prospect?.company ?? "");
  const [email, setEmail] = useState(prospect?.email ?? "");
  const [phone, setPhone] = useState(prospect?.phone ?? "");
  const [source, setSource] = useState(prospect?.source ?? "");
  const [stage, setStage] = useState<string>(prospect?.stage ?? "new");
  const [estValue, setEstValue] = useState(
    prospect ? String(prospect.est_value ?? "") : ""
  );
  const [currency, setCurrency] = useState(prospect?.currency ?? "INR");
  const [notes, setNotes] = useState(prospect?.notes ?? "");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): ProspectInput => ({
    name,
    company,
    email,
    phone,
    source,
    stage,
    est_value: Number(estValue) || 0,
    currency,
    notes,
  });

  const reset = () => {
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setSource("");
    setStage("new");
    setEstValue("");
    setCurrency("INR");
    setNotes("");
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createProspect(build())
        : await updateProspect(prospect!.id, build());
      if (res.ok) {
        if (isNew) reset();
        router.refresh();
        onSaved?.();
      } else {
        setError(res.error || "save failed");
      }
    });
  };

  const remove = () => {
    if (!prospect) return;
    if (!window.confirm(`Permanently delete "${prospect.name}"?`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteProspect(prospect.id);
      if (res.ok) {
        router.refresh();
        onSaved?.();
      } else {
        setError(res.error || "delete failed");
      }
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className={labelClass}>// company</label>
          <input
            className={inputClass}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@acme.com"
          />
        </div>
        <div>
          <label className={labelClass}>// phone</label>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 …"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// source</label>
          <input
            className={inputClass}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Referral, LinkedIn, …"
          />
        </div>
        <div>
          <label className={labelClass}>// stage</label>
          <select
            className={inputClass}
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// est. value</label>
          <input
            type="number"
            inputMode="decimal"
            className={inputClass}
            value={estValue}
            onChange={(e) => setEstValue(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelClass}>// currency</label>
          <select
            className={inputClass}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-5">
        <label className={labelClass}>// notes</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending || name.trim() === ""}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : isNew ? "Add prospect" : "Save changes"}
          </button>
          {error && (
            <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>
          )}
        </div>
        {!isNew && (
          <button
            onClick={remove}
            disabled={pending}
            className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
          >
            delete
          </button>
        )}
      </div>
    </div>
  );
}
