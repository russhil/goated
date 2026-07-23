"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Drawer from "../components/drawer";
import ContentForm from "./content-form";
import { updateContentStatus, deleteContent, toggleContentStar } from "./actions";
import {
  KIND_EMOJI,
  PLATFORM_LABEL,
  STATUS_LABEL,
  STATUSES,
  accountColor,
  istDayLabel,
  istTimeLabel,
  type ContentItem,
  type ContentAccount,
} from "./content-vocab";

export default function ContentList({
  items,
  accounts,
  canManage,
}: {
  items: ContentItem[];
  accounts: ContentAccount[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [pending, startTransition] = useTransition();

  const accById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const changeStatus = (id: string, status: string) =>
    startTransition(async () => {
      await updateContentStatus(id, status);
      router.refresh();
    });

  const star = (i: ContentItem) =>
    startTransition(async () => {
      await toggleContentStar(i.id, !i.starred);
      router.refresh();
    });

  const remove = (i: ContentItem) => {
    if (!window.confirm(`Delete "${i.title}"?`)) return;
    startTransition(async () => {
      await deleteContent(i.id);
      router.refresh();
    });
  };

  return (
    <>
      <div className="overflow-x-auto border border-dark/10 rounded-2xl bg-white">
        <table className="w-full text-sm font-sans min-w-[900px]">
          <thead>
            <tr className="text-left text-muted font-mono text-[10px] uppercase tracking-widest border-b border-dark/10">
              {canManage && <th className="p-3 w-8" />}
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Account</th>
              <th className="p-3">Status</th>
              <th className="p-3">Scheduled</th>
              {canManage && <th className="p-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const acc = i.account_id ? accById.get(i.account_id) : undefined;
              return (
                <tr
                  key={i.id}
                  className="border-b border-dark/5 last:border-0 hover:bg-dark/[0.02] align-top"
                >
                  {canManage && (
                    <td className="p-3">
                      <button
                        onClick={() => star(i)}
                        disabled={pending}
                        title={i.starred ? "Unstar" : "Mark star performer"}
                        className={`text-sm ${i.starred ? "" : "opacity-30 hover:opacity-70"}`}
                      >
                        {i.starred ? "⭐" : "☆"}
                      </button>
                    </td>
                  )}
                  <td className="p-3 text-dark font-medium">
                    {i.title}
                    {i.topic && (
                      <span className="block font-sans text-xs text-muted mt-0.5">{i.topic}</span>
                    )}
                  </td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {KIND_EMOJI[i.kind]} {i.kind}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {acc ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: accountColor(acc) }}
                        />
                        <span className="text-dark">{acc.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3">
                    {canManage ? (
                      <select
                        value={i.status}
                        onChange={(e) => changeStatus(i.id, e.target.value)}
                        disabled={pending}
                        className="px-2 py-1 border border-dark/10 rounded-lg bg-white text-xs font-sans focus:border-coral focus:outline-none disabled:opacity-50"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-mono text-[11px] text-dark/70 uppercase tracking-widest">
                        {STATUS_LABEL[i.status] ?? i.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted whitespace-nowrap">
                    {i.scheduled_at ? (
                      <>
                        {istDayLabel(i.scheduled_at)}
                        <span className="block font-mono text-[10px]">{istTimeLabel(i.scheduled_at)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  {canManage && (
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setEditing(i)}
                        className="font-mono text-[11px] text-dark/60 hover:text-coral hover:underline"
                      >
                        edit
                      </button>
                      <button
                        onClick={() => remove(i)}
                        disabled={pending}
                        className="ml-3 font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
                      >
                        delete
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit content">
        {editing && (
          <ContentForm item={editing} accounts={accounts} onSaved={() => setEditing(null)} />
        )}
      </Drawer>
    </>
  );
}
