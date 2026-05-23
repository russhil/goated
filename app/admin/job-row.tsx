"use client";

import { useState, useTransition } from "react";
import {
  createJob,
  updateJob,
  deleteJob,
  type JobFieldInput,
  type JobInput,
} from "./actions";

export type AdminJob = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  task_heading: string | null;
  task_body: string | null;
  fields: JobFieldInput[] | null;
  published: boolean;
  sort_order: number;
};

const FIELD_KEYS = [
  { value: "github_url", label: "GitHub URL" },
  { value: "linkedin_url", label: "LinkedIn URL" },
  { value: "instagram_url", label: "Instagram URL" },
  { value: "pitch", label: "Pitch" },
] as const;

const FIELD_TYPES = ["url", "text", "textarea"] as const;

const inputClass =
  "w-full px-3 py-2 border border-dark/10 rounded-lg bg-white text-sm font-sans focus:border-coral focus:outline-none";
const labelClass =
  "font-mono text-[10px] text-muted uppercase tracking-widest block mb-1";

function blankField(): JobFieldInput {
  return { key: "github_url", label: "", placeholder: "", type: "url", required: true };
}

export default function JobRow({ job }: { job?: AdminJob }) {
  const isNew = !job;
  const [title, setTitle] = useState(job?.title ?? "");
  const [slug, setSlug] = useState(job?.slug ?? "");
  const [tagline, setTagline] = useState(job?.tagline ?? "");
  const [description, setDescription] = useState(job?.description ?? "");
  const [taskHeading, setTaskHeading] = useState(job?.task_heading ?? "");
  const [taskBody, setTaskBody] = useState(job?.task_body ?? "");
  const [fields, setFields] = useState<JobFieldInput[]>(
    job?.fields && job.fields.length ? job.fields : isNew ? [blankField()] : []
  );
  const [published, setPublished] = useState(job?.published ?? true);
  const [sortOrder, setSortOrder] = useState(job?.sort_order ?? 0);

  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const updateField = (i: number, patch: Partial<JobFieldInput>) => {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };
  const removeField = (i: number) => setFields((prev) => prev.filter((_, idx) => idx !== i));
  const addField = () => setFields((prev) => [...prev, blankField()]);

  const buildInput = (): JobInput => ({
    slug,
    title,
    tagline,
    description,
    task_heading: taskHeading,
    task_body: taskBody,
    fields,
    published,
    sort_order: Number(sortOrder) || 0,
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setTagline("");
    setDescription("");
    setTaskHeading("");
    setTaskBody("");
    setFields([blankField()]);
    setPublished(true);
    setSortOrder(0);
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = isNew
        ? await createJob(buildInput())
        : await updateJob(job!.id, buildInput());
      if (result.ok) {
        setSavedAt(Date.now());
        if (isNew) resetForm();
      } else {
        setError(result.error || "save failed");
      }
    });
  };

  const handleDelete = () => {
    if (!job) return;
    if (!window.confirm(`Delete the "${job.title}" role? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteJob(job.id);
      if (!result.ok) setError(result.error || "delete failed");
    });
  };

  return (
    <li className="border border-dark/10 rounded-2xl p-6 md:p-7 bg-white">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest">
          {isNew ? "// new role" : `// ${job!.slug}`}
        </p>
        <label className="flex items-center gap-2 font-mono text-[11px] text-muted uppercase tracking-widest cursor-pointer">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-coral"
          />
          published
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="DevOps Engineer" />
        </div>
        <div>
          <label className={labelClass}>// slug (url) — leave blank to derive from title</label>
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="devops" />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>// tagline</label>
        <input className={inputClass} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ship infra that scales without drama." />
      </div>

      <div className="mb-4">
        <label className={labelClass}>// description</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// task heading</label>
          <input className={inputClass} value={taskHeading} onChange={(e) => setTaskHeading(e.target.value)} placeholder="Show us your craziest project" />
        </div>
        <div>
          <label className={labelClass}>// sort order</label>
          <input type="number" className={inputClass} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-5">
        <label className={labelClass}>// task body</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={taskBody} onChange={(e) => setTaskBody(e.target.value)} />
      </div>

      {/* Application fields editor */}
      <div className="rounded-xl bg-dark/[0.03] border border-dark/5 p-4 mb-5">
        <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-3">
          // application fields applicants fill in
        </p>
        <div className="flex flex-col gap-3">
          {fields.map((f, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 border-b border-dark/5 pb-3 last:border-0 last:pb-0">
              <div className="w-32">
                <label className={labelClass}>field</label>
                <select className={inputClass} value={f.key} onChange={(e) => updateField(i, { key: e.target.value })}>
                  {FIELD_KEYS.map((k) => (
                    <option key={k.value} value={k.value}>{k.label}</option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className={labelClass}>type</label>
                <select className={inputClass} value={f.type} onChange={(e) => updateField(i, { type: e.target.value })}>
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className={labelClass}>label</label>
                <input className={inputClass} value={f.label} onChange={(e) => updateField(i, { label: e.target.value })} placeholder="GitHub link" />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className={labelClass}>placeholder</label>
                <input className={inputClass} value={f.placeholder} onChange={(e) => updateField(i, { placeholder: e.target.value })} />
              </div>
              <label className="flex items-center gap-1.5 font-mono text-[10px] text-muted uppercase tracking-widest cursor-pointer pb-2">
                <input type="checkbox" checked={f.required} onChange={(e) => updateField(i, { required: e.target.checked })} className="accent-coral" />
                req
              </label>
              <button onClick={() => removeField(i)} className="font-mono text-[11px] text-red-600 hover:underline pb-2" type="button">
                remove
              </button>
            </div>
          ))}
        </div>
        {fields.length < FIELD_KEYS.length && (
          <button onClick={addField} type="button" className="font-mono text-[11px] text-coral hover:underline mt-3">
            + add field
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={pending || !title.trim()}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : isNew ? "Create role" : "Save changes"}
          </button>
          {savedAt && !error && (
            <span className="font-mono text-[11px] text-emerald-700">
              {isNew ? "// created" : "// saved"}
            </span>
          )}
          {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
        </div>
        {!isNew && (
          <button onClick={handleDelete} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            delete role
          </button>
        )}
      </div>
    </li>
  );
}
