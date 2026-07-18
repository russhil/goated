"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inputClass,
  labelClass,
  type Subproject,
  type TeamMember,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
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
  onSaved,
}: {
  clientId: string;
  subproject?: Subproject;
  team: TeamMember[];
  currency: string;
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
  const [collected, setCollected] = useState(
    subproject ? String(subproject.collected_revenue ?? "") : ""
  );
  const [progress, setProgress] = useState(subproject?.progress ?? 0);
  const [contributorIds, setContributorIds] = useState<string[]>(
    subproject?.contributor_ids ?? []
  );
  const [sortOrder, setSortOrder] = useState(
    subproject ? String(subproject.sort_order ?? "") : ""
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): SubprojectInput => ({
    name,
    description,
    accrued_revenue: Number(accrued) || 0,
    collected_revenue: Number(collected) || 0,
    progress: Number(progress) || 0,
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
        setCollected("");
        setProgress(0);
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

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className={labelClass}>{`// accrued revenue (${currency})`}</label>
          <input type="number" inputMode="decimal" className={inputClass} value={accrued} onChange={(e) => setAccrued(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>{`// collected revenue (${currency})`}</label>
          <input type="number" inputMode="decimal" className={inputClass} value={collected} onChange={(e) => setCollected(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>{`// progress: ${progress}%`}</label>
          <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-coral" />
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
