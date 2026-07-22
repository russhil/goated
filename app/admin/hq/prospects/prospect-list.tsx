"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/hq";
import { STAGES, STAGE_LABELS, type Prospect } from "./stages";
import { updateProspectStage, deleteProspect } from "./actions";
import Drawer from "../components/drawer";
import ProspectForm from "./prospect-form";
import FollowupCountdown from "./followup-countdown";

export default function ProspectList({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [pending, startTransition] = useTransition();

  const changeStage = (id: string, stage: string) => {
    startTransition(async () => {
      await updateProspectStage(id, stage);
      router.refresh();
    });
  };

  const remove = (p: Prospect) => {
    if (!window.confirm(`Permanently delete "${p.name}"?`)) return;
    startTransition(async () => {
      await deleteProspect(p.id);
      router.refresh();
    });
  };

  return (
    <>
      <div className="overflow-x-auto border border-dark/10 rounded-2xl bg-white">
        <table className="w-full text-sm font-sans min-w-[760px]">
          <thead>
            <tr className="text-left text-muted font-mono text-[10px] uppercase tracking-widest border-b border-dark/10">
              <th className="p-3">Name</th>
              <th className="p-3">Company</th>
              <th className="p-3">Stage</th>
              <th className="p-3 text-right">Est. value</th>
              <th className="p-3">Outreach</th>
              <th className="p-3">Follow-up</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((p) => (
              <tr
                key={p.id}
                className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.02]"
              >
                <td className="p-3 text-dark font-medium">{p.name}</td>
                <td className="p-3 text-muted">{p.company || "—"}</td>
                <td className="p-3">
                  <select
                    value={p.stage}
                    onChange={(e) => changeStage(p.id, e.target.value)}
                    disabled={pending}
                    className="px-2 py-1 border border-dark/10 rounded-lg bg-white text-xs font-sans focus:border-coral focus:outline-none disabled:opacity-50"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-right text-dark">
                  {formatMoney(p.est_value, p.currency)}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="font-mono text-[10px]">
                    {p.responded ? (
                      <span className="text-emerald-600">replied</span>
                    ) : p.reached_out ? (
                      <span className="text-dark/60">reached</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <FollowupCountdown at={p.next_followup_at} />
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(p)}
                    className="font-mono text-[11px] text-dark/60 hover:text-coral hover:underline"
                  >
                    edit
                  </button>
                  <button
                    onClick={() => remove(p)}
                    disabled={pending}
                    className="ml-3 font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit prospect"
      >
        {editing && (
          <ProspectForm prospect={editing} onSaved={() => setEditing(null)} />
        )}
      </Drawer>
    </>
  );
}
