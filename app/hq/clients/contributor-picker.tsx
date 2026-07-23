"use client";

import { labelClass, type TeamMember } from "@/lib/hq";

export default function ContributorPicker({
  team,
  value,
  onChange,
  label = "// contributors",
}: {
  team: TeamMember[];
  value: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const active = team.filter((m) => m.active || value.includes(m.id));
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {active.length === 0 ? (
        <p className="font-mono text-[11px] text-muted">
          {"// add people to the team roster first"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {active.map((m) => {
            const on = value.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggle(m.id)}
                className={`px-3 py-1 rounded-full text-xs font-sans transition ${
                  on
                    ? "bg-dark text-white"
                    : "bg-dark/[0.04] text-dark/60 hover:bg-dark/10"
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
