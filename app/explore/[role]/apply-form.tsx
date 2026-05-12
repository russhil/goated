"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { applyToRole } from "./actions";
import type { Job } from "@/lib/jobs";
import posthog from "posthog-js";

type ExistingApplication = {
  status: string;
  github_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  pitch: string | null;
  full_name: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Closed",
};

export default function ApplyForm({
  job,
  existing,
  userEmail,
}: {
  job: Job;
  existing: ExistingApplication | null;
  userEmail: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(existing != null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const result = await applyToRole(job.slug, formData);
      if (result.ok) {
        posthog.capture("job_application_submitted", {
          role: job.slug,
          is_update: existing != null,
        });
        setSuccess(true);
      } else {
        setError(result.error || "Something went wrong.");
      }
    });
  };

  return (
    <div className="border border-dark/10 rounded-2xl p-8 md:p-10 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif text-2xl text-dark">
          {existing ? "Update your submission" : "Submit your work"}
        </h3>
        {existing && (
          <span className="font-mono text-xs px-3 py-1 rounded-full bg-coral/10 text-coral uppercase tracking-widest">
            {STATUS_LABEL[existing.status] || existing.status}
          </span>
        )}
      </div>
      <p className="font-mono text-xs text-muted mb-8">
        {"// signed in as "}
        <span className="text-dark">{userEmail}</span>
      </p>

      <form action={handleSubmit} className="flex flex-col gap-6">
        <div>
          <label htmlFor="full_name" className="sr-only">
            Your name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="Your name"
            className="form-input"
            defaultValue={existing?.full_name ?? ""}
          />
        </div>

        {job.fields.map((field) => {
          const defaultValue = (existing?.[field.key] as string | null) ?? "";
          if (field.type === "textarea") {
            return (
              <div key={field.key}>
                <label htmlFor={field.key} className="sr-only">
                  {field.label}
                </label>
                <textarea
                  id={field.key}
                  name={field.key}
                  required={field.required}
                  rows={3}
                  placeholder={field.placeholder}
                  className="form-input resize-none"
                  defaultValue={defaultValue}
                />
                <p className="font-mono text-[11px] text-muted/70 mt-1">{`// ${field.label.toLowerCase()}`}</p>
              </div>
            );
          }
          return (
            <div key={field.key}>
              <label htmlFor={field.key} className="sr-only">
                {field.label}
              </label>
              <input
                id={field.key}
                name={field.key}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                className="form-input"
                defaultValue={defaultValue}
              />
              <p className="font-mono text-[11px] text-muted/70 mt-1">{`// ${field.label.toLowerCase()}`}</p>
            </div>
          );
        })}

        {error && (
          <p className="font-sans text-sm text-red-600">{error}</p>
        )}

        {success && !error && (
          <div className="border border-coral/30 bg-coral/5 rounded-xl px-4 py-3">
            <p className="font-serif text-lg text-dark">
              {existing ? "Updated." : "Submitted."}
            </p>
            <p className="font-sans text-sm text-muted">
              We&apos;ll be in touch.{" "}
              <Link href="/explore/dashboard" className="text-coral hover:underline">
                Track your application →
              </Link>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start px-8 py-4 bg-dark text-white font-sans text-sm font-medium rounded-full hover:bg-coral transition-colors duration-300 disabled:opacity-50"
        >
          {pending
            ? "Submitting..."
            : existing
            ? "Update submission →"
            : "Submit application →"}
        </button>
      </form>
    </div>
  );
}
