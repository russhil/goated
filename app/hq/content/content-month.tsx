"use client";

import { useMemo, useState } from "react";
import Drawer from "../components/drawer";
import ContentForm from "./content-form";
import {
  KIND_EMOJI,
  accountColor,
  istDayKey,
  istTimeLabel,
  type ContentItem,
  type ContentAccount,
} from "./content-vocab";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type Cell = { key: string; day: number; inMonth: boolean };

// Month grid (Monday-start), built from plain UTC calendar math so the date
// labels never drift with timezone. Items map onto cells by their IST day key.
function buildCells(year: number, month0: number): Cell[] {
  const first = new Date(Date.UTC(year, month0, 1));
  const firstDow = (first.getUTCDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
  const rows = Math.ceil((firstDow + daysInMonth) / 7);
  const start = new Date(first);
  start.setUTCDate(1 - firstDow);
  const cells: Cell[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    cells.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      day,
      inMonth: m === month0,
    });
  }
  return cells;
}

export default function ContentMonth({
  items,
  accounts,
  canManage,
  initialMonth,
  todayKey,
}: {
  items: ContentItem[];
  accounts: ContentAccount[];
  canManage: boolean;
  initialMonth: string; // "YYYY-MM"
  todayKey: string; // "YYYY-MM-DD" in IST
}) {
  const [ym, setYm] = useState(initialMonth);
  const [editing, setEditing] = useState<ContentItem | null>(null);

  const [yStr, mStr] = ym.split("-");
  const year = Number(yStr);
  const month0 = Number(mStr) - 1;

  const shift = (delta: number) => {
    const d = new Date(Date.UTC(year, month0 + delta, 1));
    setYm(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };

  const cells = useMemo(() => buildCells(year, month0), [year, month0]);

  const colorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of accounts) m.set(a.id, accountColor(a));
    return m;
  }, [accounts]);

  const byDay = useMemo(() => {
    const m = new Map<string, ContentItem[]>();
    for (const it of items) {
      if (!it.scheduled_at) continue;
      const k = istDayKey(it.scheduled_at);
      const arr = m.get(k) ?? [];
      arr.push(it);
      m.set(k, arr);
    }
    return m;
  }, [items]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <p className="font-serif text-xl text-dark">
          {MONTHS[month0]} {year}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shift(-1)}
            className="w-8 h-8 rounded-full bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition text-sm"
            aria-label="Previous month"
          >
            ◀
          </button>
          <button
            onClick={() => setYm(initialMonth)}
            className="px-3 h-8 rounded-full bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition font-mono text-[11px] uppercase tracking-widest"
          >
            today
          </button>
          <button
            onClick={() => shift(1)}
            className="w-8 h-8 rounded-full bg-dark/[0.04] text-dark/70 hover:bg-dark/10 transition text-sm"
            aria-label="Next month"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[720px] border border-dark/10 rounded-2xl overflow-hidden bg-white">
          {/* Weekday header */}
          <div className="grid grid-cols-7 bg-dark text-white">
            {WEEKDAYS.map((w) => (
              <div key={w} className="px-2 py-2 font-mono text-[10px] uppercase tracking-widest text-center">
                {w}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((c) => {
              const dayItems = byDay.get(c.key) ?? [];
              const isToday = c.key === todayKey;
              return (
                <div
                  key={c.key}
                  className={`min-h-[104px] border-t border-r border-dark/10 p-1.5 ${
                    c.inMonth ? "" : "bg-dark/[0.015]"
                  }`}
                >
                  <div className="flex justify-end">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-[11px] ${
                        isToday
                          ? "bg-coral text-white"
                          : c.inMonth
                          ? "bg-dark text-white"
                          : "text-muted"
                      }`}
                    >
                      {c.day}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {dayItems.slice(0, 3).map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => canManage && setEditing(it)}
                        title={`${it.title}${it.scheduled_at ? ` · ${istTimeLabel(it.scheduled_at)}` : ""}`}
                        className={`w-full text-left rounded-md border-l-2 bg-dark/[0.03] hover:bg-dark/[0.06] px-1.5 py-1 ${
                          canManage ? "" : "cursor-default"
                        }`}
                        style={{ borderColor: it.account_id ? colorById.get(it.account_id) ?? "#999" : "#d1d5db" }}
                      >
                        <span className="block font-sans text-[11px] text-dark leading-tight truncate">
                          {it.starred ? "⭐ " : ""}
                          {KIND_EMOJI[it.kind] ?? ""} {it.title}
                        </span>
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <span className="font-mono text-[9px] text-muted pl-1">+{dayItems.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit content">
        {editing && (
          <ContentForm item={editing} accounts={accounts} onSaved={() => setEditing(null)} />
        )}
      </Drawer>
    </>
  );
}
