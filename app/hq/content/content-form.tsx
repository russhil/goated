"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/hq";
import {
  KINDS,
  PLATFORMS,
  STATUSES,
  KIND_EMOJI,
  PLATFORM_LABEL,
  STATUS_LABEL,
  type ContentItem,
  type ContentAccount,
} from "./content-vocab";
import { createContent, updateContent, deleteContent, type ContentInput } from "./actions";

// ISO (stored, UTC) → "YYYY-MM-DDTHH:mm" in the browser's local tz for the
// datetime-local input; build() converts it back to a full ISO on save.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContentForm({
  item,
  accounts,
  onSaved,
}: {
  item?: ContentItem;
  accounts: ContentAccount[];
  onSaved?: () => void;
}) {
  const isNew = !item;
  const router = useRouter();

  const [title, setTitle] = useState(item?.title ?? "");
  const [kind, setKind] = useState(item?.kind ?? "reel");
  const [platform, setPlatform] = useState(item?.platform ?? "instagram");
  const [status, setStatus] = useState(item?.status ?? "idea");
  const [accountId, setAccountId] = useState(item?.account_id ?? "");
  const [scheduled, setScheduled] = useState(toLocalInput(item?.scheduled_at ?? null));
  const [topic, setTopic] = useState(item?.topic ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [link, setLink] = useState(item?.link ?? "");

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): ContentInput => ({
    title,
    kind,
    platform,
    status,
    account_id: accountId,
    // Convert the local datetime-local value to a full ISO instant here, where
    // the browser knows the local timezone.
    scheduled_at: scheduled ? new Date(scheduled).toISOString() : "",
    topic,
    notes,
    link,
  });

  const reset = () => {
    setTitle("");
    setKind("reel");
    setPlatform("instagram");
    setStatus("idea");
    setAccountId("");
    setScheduled("");
    setTopic("");
    setNotes("");
    setLink("");
  };

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew ? await createContent(build()) : await updateContent(item!.id, build());
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
    if (!item) return;
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteContent(item.id);
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
      <div className="mb-4">
        <label className={labelClass}>// title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 3 editing myths"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass}>// type</label>
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_EMOJI[k]} {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// platform</label>
          <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// account (whose handle)</label>
          <select
            className={inputClass}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— no account —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.handle ? ` (@${a.handle})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// scheduled upload (date &amp; time)</label>
          <input
            type="datetime-local"
            className={inputClass}
            value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>// what it&apos;s about</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="the hook / topic / talking points"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className={labelClass}>// link (draft / published)</label>
          <input
            className={inputClass}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className={labelClass}>// notes</label>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={pending || title.trim() === ""}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : isNew ? "Add to pipeline" : "Save changes"}
          </button>
          {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
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
