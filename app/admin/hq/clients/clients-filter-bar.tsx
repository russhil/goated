"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CURRENCIES, type Health, type TeamMember } from "@/lib/hq";

// Health filter values map 1:1 to healthColor()'s output so the server can
// compare with strict equality.
const HEALTH_OPTIONS: { value: Health; label: string }[] = [
  { value: "green", label: "On track" },
  { value: "amber", label: "At risk" },
  { value: "red", label: "Off track" },
  { value: "grey", label: "No data" },
  { value: "completed", label: "Completed" },
];

const selectClass =
  "font-mono text-[11px] uppercase tracking-widest text-dark/70 bg-light/40 border border-dark/10 rounded-full px-3 py-1.5 focus:border-coral focus:outline-none";

// Sort keys map 1:1 to the server's sort handling in page.tsx.
const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "contract", label: "Contract" },
  { value: "collected", label: "Collected" },
  { value: "outstanding", label: "Outstanding" },
  { value: "progress", label: "Progress" },
  { value: "kickoff", label: "Kickoff date" },
];

export default function ClientsFilterBar({
  industries,
  team,
  resultCount,
}: {
  industries: string[];
  team: TeamMember[];
  resultCount: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const industry = params.get("industry") ?? "";
  const currency = params.get("currency") ?? "";
  const health = params.get("health") ?? "";
  const contributor = params.get("contributor") ?? "";
  const sort = params.get("sort") ?? "kickoff";
  const dir = params.get("dir") ?? "desc";
  const hasFilters = Boolean(
    industry || currency || health || contributor || params.get("sort") || params.get("dir")
  );

  // Preserve any param we don't own (notably `archived`) when writing.
  const push = (next: URLSearchParams) => {
    const qs = next.toString();
    router.push(qs ? `/admin/hq/clients?${qs}` : "/admin/hq/clients");
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    push(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    const archived = params.get("archived");
    if (archived) next.set("archived", archived);
    push(next);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap mb-6">
      <select
        className={selectClass}
        value={industry}
        onChange={(e) => setParam("industry", e.target.value)}
      >
        <option value="">all industries</option>
        {industries.map((i) => (
          <option key={i} value={i}>{i}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={currency}
        onChange={(e) => setParam("currency", e.target.value)}
      >
        <option value="">all currencies</option>
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={health}
        onChange={(e) => setParam("health", e.target.value)}
      >
        <option value="">all health</option>
        {HEALTH_OPTIONS.map((h) => (
          <option key={h.value} value={h.value}>{h.label}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={contributor}
        onChange={(e) => setParam("contributor", e.target.value)}
      >
        <option value="">all contributors</option>
        {team.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>

      <span className="w-px h-5 bg-dark/10 mx-1" />

      <select
        className={selectClass}
        value={sort}
        onChange={(e) => setParam("sort", e.target.value === "kickoff" ? "" : e.target.value)}
        title="Sort by"
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>sort: {s.label}</option>
        ))}
      </select>

      <button
        onClick={() => setParam("dir", dir === "asc" ? "" : "asc")}
        className={selectClass}
        title="Toggle sort direction"
      >
        {dir === "asc" ? "↑ asc" : "↓ desc"}
      </button>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="font-mono text-[11px] uppercase tracking-widest text-coral hover:underline px-2 py-1.5"
        >
          clear filters
        </button>
      )}

      <span className="font-mono text-[11px] text-muted ml-auto">
        {`// ${resultCount} ${resultCount === 1 ? "client" : "clients"}`}
      </span>
    </div>
  );
}
