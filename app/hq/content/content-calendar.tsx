"use client";

import { useState } from "react";
import Drawer from "../components/drawer";
import ContentForm from "./content-form";
import {
  KIND_EMOJI,
  PLATFORM_LABEL,
  STATUS_LABEL,
  STATUS_CHIP,
  istDayKey,
  istDayLabel,
  istTimeLabel,
  type ContentItem,
} from "./content-vocab";

// Schedule view: scheduled items grouped by IST day (ascending), unscheduled
// last. Timezone-pinned formatting (in the vocab helpers) keeps SSR and client
// identical — no hydration mismatch.
export default function ContentCalendar({
  items,
  canManage,
}: {
  items: ContentItem[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const scheduled = items.filter((i) => i.scheduled_at);
  const unscheduled = items.filter((i) => !i.scheduled_at);

  const groups = new Map<string, ContentItem[]>();
  for (const i of scheduled) {
    const key = istDayKey(i.scheduled_at as string);
    const arr = groups.get(key) ?? [];
    arr.push(i);
    groups.set(key, arr);
  }
  const dayKeys = Array.from(groups.keys()).sort();

  const Row = ({ i }: { i: ContentItem }) => (
    <button
      type="button"
      onClick={() => canManage && setEditing(i)}
      className={`w-full text-left grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3 border-t border-dark/10 first:border-0 ${
        canManage ? "hover:bg-dark/[0.02]" : "cursor-default"
      }`}
    >
      <span className="text-lg" aria-hidden>
        {KIND_EMOJI[i.kind] ?? "🎬"}
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-base text-dark truncate">{i.title}</span>
        {i.topic && <span className="block font-sans text-xs text-muted truncate">{i.topic}</span>}
        <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
          {PLATFORM_LABEL[i.platform] ?? i.platform} · {i.kind}
        </span>
      </span>
      <span className="text-right shrink-0">
        {i.scheduled_at && (
          <span className="block font-mono text-[11px] text-dark">{istTimeLabel(i.scheduled_at)}</span>
        )}
        <span
          className={`inline-block mt-1 font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
            STATUS_CHIP[i.status] ?? ""
          }`}
        >
          {STATUS_LABEL[i.status] ?? i.status}
        </span>
      </span>
    </button>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {dayKeys.map((key) => {
          const rows = groups.get(key) as ContentItem[];
          return (
            <div key={key}>
              <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-2">
                {istDayLabel(rows[0].scheduled_at as string)}
              </p>
              <div className="border border-dark/10 rounded-2xl bg-white overflow-hidden">
                {rows.map((i) => (
                  <Row key={i.id} i={i} />
                ))}
              </div>
            </div>
          );
        })}

        {unscheduled.length > 0 && (
          <div>
            <p className="font-mono text-[11px] text-muted uppercase tracking-widest mb-2">
              {"// unscheduled"}
            </p>
            <div className="border border-dark/10 rounded-2xl bg-white overflow-hidden">
              {unscheduled.map((i) => (
                <Row key={i.id} i={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit content">
        {editing && <ContentForm item={editing} onSaved={() => setEditing(null)} />}
      </Drawer>
    </>
  );
}
