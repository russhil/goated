"use client";

import { useState, useTransition } from "react";
import { updateBookingInquiry } from "./actions";

type BookingInquiry = {
  id: string;
  name: string;
  email: string;
  business_description: string;
  status: string;
  admin_notes: string | null;
  booked_at: string | null;
  created_at: string;
};

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "booked", label: "Booked" },
  { value: "no_show", label: "No-show" },
  { value: "archived", label: "Archived" },
];

export default function BookingRow({ inquiry }: { inquiry: BookingInquiry }) {
  const [status, setStatus] = useState(inquiry.status);
  const [notes, setNotes] = useState(inquiry.admin_notes ?? "");
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const dirty = status !== inquiry.status || notes !== (inquiry.admin_notes ?? "");

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await updateBookingInquiry(inquiry.id, status, notes);
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
            {" · "}
            {new Date(inquiry.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {inquiry.booked_at && (
              <>
                {" · "}
                <span className="text-emerald-700">
                  {"// booked "}
                  {new Date(inquiry.booked_at).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
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
          what their business does
        </p>
        <p className="font-sans text-dark text-sm leading-relaxed whitespace-pre-wrap">
          {inquiry.business_description}
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
          href={`mailto:${inquiry.email}?subject=Re%3A%20your%20call%20with%20GOATED.&body=Hi%20${encodeURIComponent(inquiry.name)}%2C%0A%0A`}
          className="px-5 py-2 border border-dark/15 text-dark font-sans text-xs font-medium rounded-full hover:border-dark transition-colors"
        >
          Email →
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
