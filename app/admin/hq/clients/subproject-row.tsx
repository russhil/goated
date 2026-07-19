"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inputClass,
  labelClass,
  subProgress,
  subOffTrack,
  phasesTotal,
  formatMoney,
  type Phase,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
import PhasesEditor from "./phases-editor";
import {
  createSubproject,
  updateSubproject,
  deleteSubproject,
  type SubprojectInput,
} from "./actions";

export default function SubprojectRow({
  clientId,
  subproject,
  team,
  currency,
  kickoffDate,
  onSaved,
}: {
  clientId: string;
  subproject?: Subproject;
  team: TeamMember[];
  currency: string;
  kickoffDate: string | null;
  onSaved?: () => void;
}) {
  const isNew = !subproject;
  const router = useRouter();
  const [name, setName] = useState(subproject?.name ?? "");
  const [description, setDescription] = useState(subproject?.description ?? "");
  // Money/order kept as strings so the fields can be emptied; coerced on save.
  const [accrued, setAccrued] = useState(
    subproject ? String(subproject.accrued_revenue ?? "") : ""
  );
  // collected_revenue is no longer entered — it's the sum of the phase amounts.
  // Seed legacy sub-projects that only have a collected total so editing them
  // doesn't silently zero their collection.
  const [phases, setPhases] = useState<Phase[]>(() => {
    if (subproject?.phases && subproject.phases.length > 0) return subproject.phases;
    if (subproject && subproject.collected_revenue > 0)
      return [{ name: "Phase 1", date: subproject.due_date ?? "", amount: subproject.collected_revenue }];
    return [];
  });
  const [dueDate, setDueDate] = useState(subproject?.due_date ?? "");
  const [contributorIds, setContributorIds] = useState<string[]>(
    subproject?.contributor_ids ?? []
  );
  const [sortOrder, setSortOrder] = useState(
    subproject ? String(subproject.sort_order ?? "") : ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Progress is auto: collected ÷ accrued, live from the editable state.
  // Collected is the running sum of the phase amounts.
  const collectedTotal = phasesTotal(phases);
  const autoProgress = subProgress({
    accrued_revenue: Number(accrued) || 0,
    collected_revenue: collectedTotal,
  });

  // Off-track badge reflects the SAVED state, not the in-progress edits.
  const offTrack =
    !isNew &&
    subOffTrack(
      {
        accrued_revenue: subproject!.accrued_revenue,
        collected_revenue: subproject!.collected_revenue,
        due_date: subproject!.due_date,
      },
      kickoffDate
    );

  const build = (): SubprojectInput => ({
    name,
    description,
    accrued_revenue: Number(accrued) || 0,
    phases,
    due_date: dueDate,
    contributor_ids: contributorIds,
    sort_order: Number(sortOrder) || 0,
  });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createSubproject(clientId, build())
        : await updateSubproject(subproject!.id, build());
      if (!res.ok) {
        setError(res.error || "save failed");
        return;
      }
      if (isNew) {
        setName("");
        setDescription("");
        setAccrued("");
        setPhases([]);
        setDueDate("");
        setContributorIds([]);
        setSortOrder("");
      }
      router.refresh();
      onSaved?.();
    });
  };

  const remove = () => {
    if (!subproject) return;
    if (!window.confirm(`Delete sub-project "${subproject.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteSubproject(subproject.id);
      if (!res.ok) setError(res.error || "delete failed");
      else router.refresh();
    });
  };

  return (
    <div className="border border-dark/10 rounded-xl p-4 bg-light/30">
      {offTrack && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-red-600 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
            ⚑ off track
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>// sub-project name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Payments API" />
        </div>
        <div>
          <label className={labelClass}>// sort order</label>
          <input type="number" inputMode="numeric" className={inputClass} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="mb-3">
        <label className={labelClass}>// description</label>
        <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelClass}>{`// accrued revenue (${currency})`}</label>
          <input type="number" inputMode="decimal" min={0} className={inputClass} value={accrued} onChange={(e) => setAccrued(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>// due date</label>
          <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      {/* Collected is the sum of the phase amounts — entered below, not typed. */}
      <PhasesEditor value={phases} onChange={setPhases} />

      {/* Progress is auto (collected ÷ accrued) — read-only. */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <label className={labelClass}>{`// progress: ${autoProgress}%`}</label>
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
            {`collected ${formatMoney(collectedTotal, currency)}`}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-dark/10 overflow-hidden">
          <div className="h-full bg-coral rounded-full transition-all" style={{ width: `${autoProgress}%` }} />
        </div>
      </div>

      <div className="mb-3">
        <ContributorPicker team={team} value={contributorIds} onChange={setContributorIds} />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={pending || name.trim() === ""}
          className="px-4 py-1.5 bg-dark text-white text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40"
        >
          {pending ? "Saving..." : isNew ? "Add sub-project" : "Save"}
        </button>
        {!isNew && (
          <button onClick={remove} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            delete
          </button>
        )}
        {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
      </div>
    </div>
  );
}
