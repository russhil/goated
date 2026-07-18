"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/hq";
import { STAGES, STAGE_LABELS, type Prospect, type Stage } from "./stages";
import { updateProspectStage } from "./actions";
import Drawer from "../components/drawer";
import ProspectForm from "./prospect-form";

const arrowBtn =
  "w-7 h-7 flex items-center justify-center rounded-full text-[11px] bg-dark/[0.04] text-dark/70 hover:bg-dark/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

// Lightweight kanban: real drag-and-drop is heavy, so cards move one step at a
// time via ◀/▶, disabled at the ends of the pipeline.
export default function KanbanBoard({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (p: Prospect, dir: -1 | 1) => {
    const next: Stage | undefined = STAGES[STAGES.indexOf(p.stage) + dir];
    if (!next) return;
    startTransition(async () => {
      await updateProspectStage(p.id, next);
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const rows = prospects.filter((p) => p.stage === stage);
          const value = rows.reduce((s, p) => s + Number(p.est_value || 0), 0);
          const currency = rows[0]?.currency ?? "INR";
          return (
            <div key={stage} className="flex-shrink-0 w-[260px] min-w-[260px]">
              <div className="flex items-center justify-between mb-1 px-1">
                <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
                  {STAGE_LABELS[stage]}
                </p>
                <span className="font-mono text-[10px] text-muted">{rows.length}</span>
              </div>
              <p className="font-sans text-xs text-muted mb-3 px-1">
                {formatMoney(value, currency)}
              </p>
              <div className="flex flex-col gap-2">
                {rows.map((p) => {
                  const idx = STAGES.indexOf(p.stage);
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-dark/10 rounded-2xl p-3 hover:border-coral/40 transition-colors"
                    >
                      <button
                        onClick={() => setEditing(p)}
                        className="text-left w-full"
                      >
                        <p className="font-serif text-base text-dark leading-tight">
                          {p.name}
                        </p>
                        {p.company && (
                          <p className="font-sans text-xs text-muted mt-0.5">
                            {p.company}
                          </p>
                        )}
                        <p className="font-sans text-sm text-dark mt-2">
                          {formatMoney(p.est_value, p.currency)}
                        </p>
                        {p.source && (
                          <p className="font-mono text-[10px] text-muted uppercase tracking-widest mt-1 truncate">
                            {p.source}
                          </p>
                        )}
                      </button>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-dark/5">
                        <button
                          onClick={() => move(p, -1)}
                          disabled={pending || idx === 0}
                          className={arrowBtn}
                          aria-label="Move to previous stage"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          className="font-mono text-[10px] text-muted hover:text-coral transition-colors"
                        >
                          edit
                        </button>
                        <button
                          onClick={() => move(p, 1)}
                          disabled={pending || idx === STAGES.length - 1}
                          className={arrowBtn}
                          aria-label="Move to next stage"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  );
                })}
                {rows.length === 0 && (
                  <div className="border border-dashed border-dark/10 rounded-2xl p-4 text-center">
                    <p className="font-mono text-[10px] text-muted">empty</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
