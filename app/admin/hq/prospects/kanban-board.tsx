"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/hq";
import { STAGES, STAGE_LABELS, isStage, type Prospect, type Stage } from "./stages";
import {
  updateProspectStage,
  createProspect,
  markFollowedUp,
  type ProspectInput,
} from "./actions";
import Drawer from "../components/drawer";
import ProspectForm from "./prospect-form";
import NewProspectDrawer from "./new-prospect-drawer";
import FollowupCountdown from "./followup-countdown";

const arrowBtn =
  "w-7 h-7 flex items-center justify-center rounded-full text-[11px] bg-dark/[0.04] text-dark/70 hover:bg-dark/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors";

// Drag-and-drop kanban. Cards live in local state so a move paints instantly;
// the server write happens in the background (no router.refresh, so no loading
// flash) and only touches state again if it fails, to revert.
export default function KanbanBoard({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Stable temp ids for optimistic cards — an in-render counter, never
  // Math.random/Date.now (those would break render purity / SSR hydration).
  const tempCounter = useRef(0);

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
    // A temp card isn't in the DB yet — skip the doomed stage write until the
    // background create + refresh has swapped it for the real row.
    if (id.startsWith("temp-")) return;
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

  // "✓ done" on a card: reset its follow-up timer to the next cadence.
  const markDone = (id: string) => {
    if (id.startsWith("temp-")) return;
    startTransition(async () => {
      await markFollowedUp(id);
      router.refresh();
    });
  };

  // Optimistic create: paint a temp card immediately, then persist in the
  // background. On success a quiet router.refresh() replaces the temp with the
  // real server row (see the seed reconciliation above); on failure we drop the
  // temp and surface an inline error. No await before paint, so it's instant.
  const add = (input: ProspectInput) => {
    const tempId = `temp-${(tempCounter.current += 1)}`;
    const now = new Date().toISOString();
    const temp: Prospect = {
      id: tempId,
      name: input.name.trim() || "Untitled",
      company: input.company.trim() || null,
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      source: input.source.trim() || null,
      stage: isStage(input.stage) ? input.stage : "new",
      est_value: Number(input.est_value) || 0,
      currency: input.currency || "INR",
      notes: input.notes.trim() || null,
      sort_order: 0,
      reached_out: !!input.reached_out,
      reached_out_on: input.reached_out_on || null,
      responded: !!input.responded,
      next_followup_at: null, // the real server row carries the started timer
      last_reminded_at: null,
      created_at: now,
      updated_at: now,
    };
    setError(null);
    setItems((list) => [temp, ...list]);
    startTransition(async () => {
      const res = await createProspect(input);
      if (res.ok) {
        router.refresh();
      } else {
        setItems((list) => list.filter((p) => p.id !== tempId));
        setError(res.error || "create failed");
      }
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-3 mb-3">
        {error && (
          <p className="font-mono text-[11px] text-red-600 mr-auto">{`// ${error}`}</p>
        )}
        <NewProspectDrawer onCreate={add} />
      </div>

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
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {p.reached_out && (
                            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-dark/[0.06] text-dark/70">
                              reached
                            </span>
                          )}
                          {p.responded && (
                            <span className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                              replied
                            </span>
                          )}
                          <FollowupCountdown at={p.next_followup_at} />
                        </div>
                        {p.next_followup_at && (
                          <button
                            onClick={() => markDone(p.id)}
                            className="font-mono text-[9px] text-muted hover:text-coral whitespace-nowrap"
                          >
                            ✓ done
                          </button>
                        )}
                      </div>
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
