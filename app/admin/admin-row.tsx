"use client";

import { useState, useTransition } from "react";
import { updateApplication } from "./actions";

type Application = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  pitch: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
};

const STATUSES = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminRow({
  app,
  roleLabel,
}: {
  app: Application;
  roleLabel?: string;
}) {
  const [status, setStatus] = useState(app.status);
  const [notes, setNotes] = useState(app.admin_notes ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const dirty = status !== app.status || notes !== (app.admin_notes ?? "");

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await updateApplication(app.id, status, notes);
      if (result.ok) {
        setSavedAt(Date.now());
      } else {
        setError(result.error || "save failed");
      }
    });
  };

  return (
    <li className="border border-dark/10 rounded-2xl p-6 md:p-7 bg-white">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-1">
            {roleLabel ?? app.role}
          </p>
          <h3 className="font-serif text-dark text-xl">
            {app.full_name || app.email}
          </h3>
          <p className="font-mono text-xs text-muted">
            {app.email} ·{" "}
            {new Date(app.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="font-mono text-xs px-3 py-2 border border-dark/15 rounded-full bg-white text-dark focus:border-coral focus:outline-none cursor-pointer"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
        {app.github_url && (
          <a
            href={app.github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-dark hover:text-coral transition-colors truncate link-underline"
          >
            GitHub →
          </a>
        )}
        {app.linkedin_url && (
          <a
            href={app.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-dark hover:text-coral transition-colors truncate link-underline"
          >
            LinkedIn →
          </a>
        )}
        {app.instagram_url && (
          <a
            href={app.instagram_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-dark hover:text-coral transition-colors truncate link-underline"
          >
            Instagram →
          </a>
        )}
      </div>

      {app.pitch && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-dark/[0.03] border border-dark/5">
          <p className="font-mono text-[10px] text-muted mb-1 uppercase tracking-widest">
            applicant pitch
          </p>
          <p className="font-serif italic text-dark text-sm leading-relaxed">
            &ldquo;{app.pitch}&rdquo;
          </p>
        </div>
      )}

      <div>
        <label className="font-mono text-[10px] text-muted uppercase tracking-widest block mb-2">
          // private notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Internal notes — only admins see this."
          className="w-full px-3 py-2 border border-dark/10 rounded-lg bg-white text-sm font-sans focus:border-coral focus:outline-none resize-none"
        />
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!dirty || pending}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
          {savedAt && !dirty && !error && (
            <span className="font-mono text-[11px] text-emerald-700">
              {"// saved"}
            </span>
          )}
          {error && (
            <span className="font-mono text-[11px] text-red-600">
              {`// ${error}`}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
