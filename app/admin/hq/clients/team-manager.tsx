"use client";

import { useState, useTransition } from "react";
import { inputClass, type TeamMember } from "@/lib/hq";
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMemberInput,
} from "./team-actions";

function MemberRow({ member }: { member?: TeamMember }) {
  const isNew = !member;
  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState(member?.role ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [active, setActive] = useState(member?.active ?? true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const build = (): TeamMemberInput => ({ name, role, email, active });

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createTeamMember(build())
        : await updateTeamMember(member!.id, build());
      if (!res.ok) setError(res.error || "save failed");
      else if (isNew) {
        setName("");
        setRole("");
        setEmail("");
        setActive(true);
      }
    });
  };

  const remove = () => {
    if (!member) return;
    if (!window.confirm(`Remove ${member.name} from the roster?`)) return;
    startTransition(async () => {
      const res = await deleteTeamMember(member.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        className={`${inputClass} max-w-[180px]`}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        className={`${inputClass} max-w-[150px]`}
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Role"
      />
      <input
        className={`${inputClass} max-w-[200px]`}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email (optional)"
      />
      <label className="flex items-center gap-1 font-mono text-[11px] text-muted">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-coral"
        />
        active
      </label>
      <button
        onClick={save}
        disabled={pending || !name.trim()}
        className="px-4 py-2 bg-dark text-white text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40"
      >
        {isNew ? "Add" : "Save"}
      </button>
      {!isNew && (
        <button
          onClick={remove}
          disabled={pending}
          className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
        >
          remove
        </button>
      )}
      {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
    </div>
  );
}

export default function TeamManager({ team }: { team: TeamMember[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-dark/10 rounded-2xl p-6 bg-light/40 mb-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="font-mono text-[11px] text-coral uppercase tracking-widest"
      >
        {open ? "▾" : "▸"} team roster ({team.length})
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-3">
          {team.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
          <div className="pt-2 border-t border-dark/10">
            <MemberRow />
          </div>
        </div>
      )}
    </div>
  );
}
