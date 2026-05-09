"use client";

import { useState, useTransition } from "react";
import { updateInquiry } from "./actions";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: string;
  admin_notes: string | null;
  forwarded_to_email: boolean;
  created_at: string;
};

const STATUSES = [
  { value: "new", label: "New" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

export default function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [status, setStatus] = useState(inquiry.status);
  const [notes, setNotes] = useState(inquiry.admin_notes ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const dirty = status !== inquiry.status || notes !== (inquiry.admin_notes ?? "");

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await updateInquiry(inquiry.id, status, notes);
      if (result.ok) setSavedAt(Date.now());
      else setError(result.error || "save failed");
    });
  };

  return (
    <li className="border border-dark/10 rounded-2xl p-6 md:p-7 bg-white">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="font-serif text-dark text-xl truncate">{inquiry.name}</h3>
          <p className="font-mono text-xs text-muted">
            <a
              href={`mailto:${inquiry.email}`}
              className="text-dark hover:text-coral transition-colors"
            >
              {inquiry.email}
            </a>
            {inquiry.phone && (
              <>
                {" · "}
                <a
                  href={`tel:${inquiry.phone}`}
                  className="text-dark hover:text-coral transition-colors"
                >
                  {inquiry.phone}
                </a>
              </>
            )}
            {" · "}
            {new Date(inquiry.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {!inquiry.forwarded_to_email && (
              <>
                {" · "}
                <span className="text-amber-600">{"// not emailed"}</span>
              </>
            )}
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

      <div className="mb-5 px-4 py-3 rounded-xl bg-dark/[0.03] border border-dark/5">
        <p className="font-mono text-[10px] text-muted mb-1 uppercase tracking-widest">
          message
        </p>
        <p className="font-sans text-dark text-sm leading-relaxed whitespace-pre-wrap">
          {inquiry.message}
        </p>
      </div>

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

      <div className="flex items-center gap-3 mt-4 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!dirty || pending}
          className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        <a
          href={`mailto:${inquiry.email}?subject=Re%3A%20your%20inquiry%20to%20GOATED.&body=Hi%20${encodeURIComponent(inquiry.name)}%2C%0A%0A`}
          className="px-5 py-2 border border-dark/15 text-dark font-sans text-xs font-medium rounded-full hover:border-dark transition-colors"
        >
          Reply via email →
        </a>
        {savedAt && !dirty && !error && (
          <span className="font-mono text-[11px] text-emerald-700">{"// saved"}</span>
        )}
        {error && (
          <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>
        )}
      </div>
    </li>
  );
}
