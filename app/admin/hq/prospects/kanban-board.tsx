"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/hq";
import { STAGES, STAGE_LABELS, type Prospect, type Stage } from "./stages";
import { updateProspectStage } from "./actions";
import Drawer from "../components/drawer";
import ProspectForm from "./prospect-form";

const arrowBtn =
  "w-7 h-7 flex items-center justify-center rounded-full text-[11px] bg-dark/[0.04] text-dark/70 hover:bg-dark/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

// Drag-and-drop kanban. Cards live in local state so a move paints instantly;
// the server write happens in the background (no router.refresh, so no loading
// flash) and only touches state again if it fails, to revert.
export default function KanbanBoard({ prospects }: { prospects: Prospect[] }) {
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic copy of the pipeline. Re-seed only when the parent hands us a
  // *new* array (a router.refresh after edit/create, or navigation) — client-
  // only re-renders keep the same prop reference, so drags survive them.
  const [items, setItems] = useState<Prospect[]>(prospects);
  const [seed, setSeed] = useState(prospects);
  if (seed !== prospects) {
    setSeed(prospects);
    setItems(prospects);
  }

  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);

  // Optimistically drop a card into `next`, then persist. On failure, roll the
  // card back to where it was and surface an inline error.
  const moveTo = (id: string, next: Stage) => {
    const current = items.find((p) => p.id === id);
    if (!current || current.stage === next) return;
    const prevStage = current.stage;
    setError(null);
    setItems((list) => list.map((p) => (p.id === id ? { ...p, stage: next } : p)));
    startTransition(async () => {
      const res = await updateProspectStage(id, next);
      if (!res.ok) {
        setItems((list) =>
          list.map((p) => (p.id === id ? { ...p, stage: prevStage } : p))
        );
        setError(res.error || "move failed");
      }
    });
  };

  const moveByArrow = (p: Prospect, dir: -1 | 1) => {
    const next: Stage | undefined = STAGES[STAGES.indexOf(p.stage) + dir];
    if (next) moveTo(p.id, next);
  };

  return (
    <>
      {error && (
        <p className="font-mono text-[11px] text-red-600 mb-3">{`// ${error}`}</p>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const rows = items.filter((p) => p.stage === stage);
          const value = rows.reduce((s, p) => s + Number(p.est_value || 0), 0);
          const currency = rows[0]?.currency ?? "INR";
          const isOver = overStage === stage;
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                // preventDefault is what marks this a valid drop target.
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={(e) => {
                // Ignore leaves into child cards; only clear on real column exit.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setOverStage((s) => (s === stage ? null : s));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setOverStage(null);
                setDragId(null);
                if (id) moveTo(id, stage);
              }}
              className={`flex-shrink-0 w-[260px] min-w-[260px] rounded-2xl p-1.5 transition-colors ${
                isOver
                  ? "ring-2 ring-coral/50 bg-coral/[0.04]"
                  : "ring-2 ring-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-1 px-1">
                <p className="font-mono text-[10px] text-muted uppercase tracking-widest">
                  {STAGE_LABELS[stage]}
                </p>
                <span className="font-mono text-[10px] text-muted">{rows.length}</span>
              </div>
              <p className="font-sans text-xs text-muted mb-3 px-1">
                {formatMoney(value, currency)}
              </p>
              <div className="flex flex-col gap-2 min-h-[120px]">
                {rows.map((p) => {
                  const idx = STAGES.indexOf(p.stage);
                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", p.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(p.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={`bg-white border border-dark/10 rounded-2xl p-3 hover:border-coral/40 transition-colors cursor-grab active:cursor-grabbing ${
                        dragId === p.id ? "opacity-40" : ""
                      }`}
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
                          onClick={() => moveByArrow(p, -1)}
                          disabled={idx === 0}
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
                          onClick={() => moveByArrow(p, 1)}
                          disabled={idx === STAGES.length - 1}
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
                    <p className="font-mono text-[10px] text-muted">
                      {isOver ? "drop here" : "empty"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit prospect">
        {editing && (
          <ProspectForm prospect={editing} onSaved={() => setEditing(null)} />
        )}
      </Drawer>
    </>
  );
}
