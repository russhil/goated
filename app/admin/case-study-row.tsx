"use client";

import { useRef, useState, useTransition } from "react";
import {
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  uploadCaseStudyImage,
  type CaseStudyInput,
} from "./actions";

export type AdminCaseStudy = {
  id: string;
  slug: string;
  category: string;
  tags: string[] | null;
  status: string;
  title: string;
  subtitle: string | null;
  client: string | null;
  year: string | null;
  description: string | null;
  stat: string | null;
  problem: string | null;
  built: string | null;
  result: string | null;
  result_stat: string | null;
  image_url: string | null;
  link: string | null;
  published: boolean;
  sort_order: number;
};

const CATEGORIES = ["client", "ai", "tools"] as const;
const STATUSES = ["live", "building"] as const;

const inputClass =
  "w-full px-3 py-2 border border-dark/10 rounded-lg bg-white text-sm font-sans focus:border-coral focus:outline-none";
const labelClass =
  "font-mono text-[10px] text-muted uppercase tracking-widest block mb-1";

export default function CaseStudyRow({ study }: { study?: AdminCaseStudy }) {
  const isNew = !study;
  const [title, setTitle] = useState(study?.title ?? "");
  const [slug, setSlug] = useState(study?.slug ?? "");
  const [category, setCategory] = useState(study?.category ?? "client");
  const [status, setStatus] = useState(study?.status ?? "live");
  const [tagsText, setTagsText] = useState((study?.tags ?? []).join(", "));
  const [subtitle, setSubtitle] = useState(study?.subtitle ?? "");
  const [client, setClient] = useState(study?.client ?? "");
  const [year, setYear] = useState(study?.year ?? "");
  const [description, setDescription] = useState(study?.description ?? "");
  const [stat, setStat] = useState(study?.stat ?? "");
  const [problem, setProblem] = useState(study?.problem ?? "");
  const [built, setBuilt] = useState(study?.built ?? "");
  const [result, setResult] = useState(study?.result ?? "");
  const [resultStat, setResultStat] = useState(study?.result_stat ?? "");
  const [imageUrl, setImageUrl] = useState(study?.image_url ?? "");
  const [link, setLink] = useState(study?.link ?? "");
  const [published, setPublished] = useState(study?.published ?? true);
  const [sortOrder, setSortOrder] = useState(study?.sort_order ?? 0);

  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const buildInput = (): CaseStudyInput => ({
    slug,
    category,
    tags: tagsText.split(",").map((t) => t.trim()).filter(Boolean),
    status,
    title,
    subtitle,
    client,
    year,
    description,
    stat,
    problem,
    built,
    result,
    result_stat: resultStat,
    image_url: imageUrl,
    link,
    published,
    sort_order: Number(sortOrder) || 0,
  });

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCategory("client");
    setStatus("live");
    setTagsText("");
    setSubtitle("");
    setClient("");
    setYear("");
    setDescription("");
    setStat("");
    setProblem("");
    setBuilt("");
    setResult("");
    setResultStat("");
    setImageUrl("");
    setLink("");
    setPublished(true);
    setSortOrder(0);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadCaseStudyImage(fd);
    setUploading(false);
    if (res.ok && res.url) {
      setImageUrl(res.url);
    } else {
      setError(res.error || "upload failed");
    }
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createCaseStudy(buildInput())
        : await updateCaseStudy(study!.id, buildInput());
      if (res.ok) {
        setSavedAt(Date.now());
        if (isNew) resetForm();
      } else {
        setError(res.error || "save failed");
      }
    });
  };

  const handleDelete = () => {
    if (!study) return;
    if (!window.confirm(`Delete "${study.title}"? This cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteCaseStudy(study.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  const canSave = title.trim() !== "" && (!isNew || imageUrl !== "");

  return (
    <li className="border border-dark/10 rounded-2xl p-6 md:p-7 bg-white">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <p className="font-mono text-[11px] text-coral uppercase tracking-widest">
          {isNew ? "// new case study" : `// ${study!.slug}`}
        </p>
        <label className="flex items-center gap-2 font-mono text-[11px] text-muted uppercase tracking-widest cursor-pointer">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-coral" />
          published
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// title</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Azadi Records" />
        </div>
        <div>
          <label className={labelClass}>// slug — leave blank to derive from title</label>
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="azadi" />
        </div>
        <div>
          <label className={labelClass}>// subtitle</label>
          <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Music Catalogue System" />
        </div>
        <div>
          <label className={labelClass}>// client</label>
          <input className={inputClass} value={client} onChange={(e) => setClient(e.target.value)} placeholder="Azadi Records, Mumbai" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className={labelClass}>// category</label>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// year</label>
          <input className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
        </div>
        <div>
          <label className={labelClass}>// sort order</label>
          <input type="number" className={inputClass} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>// tags (comma-separated)</label>
        <input className={inputClass} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="MUSIC, CATALOGUE MANAGEMENT" />
      </div>

      <div className="mb-4">
        <label className={labelClass}>// link (optional)</label>
        <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" />
      </div>

      <div className="mb-4">
        <label className={labelClass}>// hero image</label>
        <div className="flex items-center gap-4 flex-wrap">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="case study preview" className="h-20 w-32 object-cover rounded-lg border border-dark/10" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
            className="font-mono text-xs text-muted"
          />
          {uploading && <span className="font-mono text-[11px] text-muted">// uploading…</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// headline stat</label>
          <input className={inputClass} value={stat} onChange={(e) => setStat(e.target.value)} placeholder="100+ spreadsheets → 1 system" />
        </div>
        <div>
          <label className={labelClass}>// result stat</label>
          <input className={inputClass} value={resultStat} onChange={(e) => setResultStat(e.target.value)} placeholder="100+ spreadsheets. One dashboard." />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>// description (card blurb)</label>
        <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelClass}>// the problem</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={problem} onChange={(e) => setProblem(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelClass}>// what we built</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={built} onChange={(e) => setBuilt(e.target.value)} />
      </div>
      <div className="mb-5">
        <label className={labelClass}>// the result</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={result} onChange={(e) => setResult(e.target.value)} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={pending || uploading || !canSave}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : isNew ? "Create case study" : "Save changes"}
          </button>
          {savedAt && !error && (
            <span className="font-mono text-[11px] text-emerald-700">
              {isNew ? "// created" : "// saved"}
            </span>
          )}
          {isNew && !imageUrl && !error && (
            <span className="font-mono text-[11px] text-muted">// upload an image to create</span>
          )}
          {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
        </div>
        {!isNew && (
          <button onClick={handleDelete} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
            delete case study
          </button>
        )}
      </div>
    </li>
  );
}
