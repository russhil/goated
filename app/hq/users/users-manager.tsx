"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputClass, labelClass } from "@/lib/hq";
import {
  PRESETS,
  NO_PERMISSIONS,
  type Level,
  type Permissions,
  type Section,
} from "@/lib/hq-perms";
import { saveHqUser, setHqUserActive, deleteHqUser } from "./actions";

export type HqUserRow = {
  id: string;
  email: string;
  name: string | null;
  is_owner: boolean;
  active: boolean;
  permissions: Permissions;
};

const SECTIONS: { key: Section; label: string }[] = [
  { key: "clients", label: "Clients" },
  { key: "prospects", label: "Prospects / Kanban" },
  { key: "content", label: "Content pipeline" },
  { key: "expenses", label: "Company expenses" },
  { key: "pettyCash", label: "Petty cash" },
];

const LEVELS: Level[] = ["none", "view", "manage"];

function summarize(p: Permissions): string[] {
  const out: string[] = [];
  if (p.financials) out.push("Revenue");
  for (const s of SECTIONS) {
    if (p[s.key] !== "none") out.push(`${s.label}: ${p[s.key]}`);
  }
  if (p.users) out.push("Users");
  return out.length ? out : ["No access"];
}

function LevelPicker({
  value,
  onChange,
}: {
  value: Level;
  onChange: (l: Level) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-dark/[0.05] p-0.5">
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1 rounded-full text-[11px] font-mono capitalize transition ${
            value === l ? "bg-dark text-white" : "text-dark/60 hover:text-dark"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-coral w-4 h-4"
      />
    </label>
  );
}

function PermsEditor({
  value,
  onChange,
}: {
  value: Permissions;
  onChange: (p: Permissions) => void;
}) {
  const set = (patch: Partial<Permissions>) => onChange({ ...value, ...patch });
  return (
    <div className="border border-dark/10 rounded-2xl p-4 bg-dark/[0.01]">
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="font-mono text-[10px] text-muted uppercase tracking-widest mr-1">
          preset:
        </span>
        {Object.entries(PRESETS).map(([k, p]) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange({ ...p.perms })}
            className="px-3 py-1 rounded-full text-[11px] font-mono bg-dark/[0.05] text-dark/70 hover:bg-coral hover:text-white transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between py-2 border-t border-dark/5">
        <div>
          <p className="font-sans text-sm text-dark">Financials (revenue)</p>
          <p className="font-mono text-[10px] text-muted">
            revenue, cost, invoice amounts, finance revenue card
          </p>
        </div>
        <Toggle checked={value.financials} onChange={(b) => set({ financials: b })} />
      </div>

      {SECTIONS.map((s) => (
        <div
          key={s.key}
          className="flex items-center justify-between py-2 border-t border-dark/5"
        >
          <p className="font-sans text-sm text-dark">{s.label}</p>
          <LevelPicker
            value={value[s.key]}
            onChange={(l) => set({ [s.key]: l } as Partial<Permissions>)}
          />
        </div>
      ))}

      <div className="flex items-center justify-between py-2 border-t border-dark/5">
        <div>
          <p className="font-sans text-sm text-dark">Users &amp; permissions</p>
          <p className="font-mono text-[10px] text-muted">manage this panel</p>
        </div>
        <Toggle checked={value.users} onChange={(b) => set({ users: b })} />
      </div>
    </div>
  );
}

export default function UsersManager({
  users,
  selfEmail,
}: {
  users: HqUserRow[];
  selfEmail: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [addPerms, setAddPerms] = useState<Permissions>({ ...PRESETS.sales.perms });

  const [editId, setEditId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Permissions>({ ...NO_PERMISSIONS });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError("");
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after?.();
        router.refresh();
      } else {
        setError(res.error || "something went wrong");
      }
    });
  };

  const add = () =>
    run(
      () => saveHqUser({ email, name, permissions: addPerms }),
      () => {
        setEmail("");
        setName("");
        setAddPerms({ ...PRESETS.sales.perms });
        setAddOpen(false);
      }
    );

  const saveEdit = (row: HqUserRow) =>
    run(
      () => saveHqUser({ email: row.email, name: row.name || "", permissions: editPerms }),
      () => setEditId(null)
    );

  return (
    <div>
      {/* Add */}
      {!addOpen ? (
        <button
          onClick={() => setAddOpen(true)}
          className="mb-6 px-4 py-2 bg-dark text-white rounded-full text-sm font-medium hover:bg-coral transition"
        >
          + Add user
        </button>
      ) : (
        <div className="mb-8 border border-dark/10 rounded-2xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>// email</label>
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@company.com"
                type="email"
              />
            </div>
            <div>
              <label className={labelClass}>// name (optional)</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          </div>
          <PermsEditor value={addPerms} onChange={setAddPerms} />
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={add}
              disabled={pending || !email.trim()}
              className="px-5 py-2 bg-dark text-white rounded-full text-xs font-medium hover:bg-coral transition disabled:opacity-40"
            >
              {pending ? "Saving…" : "Add user"}
            </button>
            <button
              onClick={() => {
                setAddOpen(false);
                setError("");
              }}
              className="font-mono text-[11px] text-muted hover:text-dark"
            >
              cancel
            </button>
            {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
          </div>
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2">
        {users.map((u) => {
          const editing = editId === u.id;
          return (
            <div key={u.id} className="border border-dark/10 rounded-2xl p-4 bg-white">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-sans text-dark font-medium">
                    {u.name ? `${u.name} · ` : ""}
                    <span className="text-dark/70">{u.email}</span>
                    {u.email === selfEmail && (
                      <span className="ml-2 font-mono text-[10px] text-muted">(you)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {u.is_owner ? (
                      <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-coral/10 text-coral">
                        Owner · full access
                      </span>
                    ) : (
                      summarize(u.permissions).map((c) => (
                        <span
                          key={c}
                          className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-dark/[0.05] text-dark/60"
                        >
                          {c}
                        </span>
                      ))
                    )}
                    {!u.active && !u.is_owner && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                        deactivated
                      </span>
                    )}
                  </div>
                </div>

                {!u.is_owner && (
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setEditId(editing ? null : u.id);
                        setEditPerms({ ...u.permissions });
                        setError("");
                      }}
                      className="font-mono text-[11px] text-dark/60 hover:text-coral"
                    >
                      {editing ? "close" : "edit"}
                    </button>
                    <button
                      onClick={() => run(() => setHqUserActive(u.id, !u.active))}
                      disabled={pending}
                      className="font-mono text-[11px] text-dark/60 hover:text-coral disabled:opacity-40"
                    >
                      {u.active ? "deactivate" : "reactivate"}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${u.email}?`)) run(() => deleteHqUser(u.id));
                      }}
                      disabled={pending}
                      className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>

              {editing && (
                <div className="mt-4">
                  <PermsEditor value={editPerms} onChange={setEditPerms} />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => saveEdit(u)}
                      disabled={pending}
                      className="px-5 py-2 bg-dark text-white rounded-full text-xs font-medium hover:bg-coral transition disabled:opacity-40"
                    >
                      {pending ? "Saving…" : "Save changes"}
                    </button>
                    {error && (
                      <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
