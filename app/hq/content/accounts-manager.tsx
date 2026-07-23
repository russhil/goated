"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/hq";
import { PLATFORMS, PLATFORM_LABEL, accountColor, type ContentAccount } from "./content-vocab";
import { createContentAccount, deleteContentAccount } from "./actions";

// Collapsible roster of the accounts we post on (add / remove). Mirrors the
// team-manager pattern on the clients page. Only rendered for content managers.
export default function AccountsManager({ accounts }: { accounts: ContentAccount[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [platform, setPlatform] = useState("instagram");

  const add = () => {
    setError("");
    startTransition(async () => {
      const res = await createContentAccount({ name, handle, platform, color: "", active: true });
      if (res.ok) {
        setName("");
        setHandle("");
        setPlatform("instagram");
        router.refresh();
      } else {
        setError(res.error || "failed");
      }
    });
  };

  const remove = (a: ContentAccount) => {
    if (!window.confirm(`Remove account "${a.name}"? (content stays, just unlinked)`)) return;
    startTransition(async () => {
      await deleteContentAccount(a.id);
      router.refresh();
    });
  };

  return (
    <div className="mb-6 border border-dark/10 rounded-2xl bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3"
      >
        <span className="font-mono text-[11px] text-coral uppercase tracking-widest">
          {`// accounts (${accounts.length})`}
        </span>
        <span className="font-mono text-[11px] text-muted">{open ? "hide" : "manage"}</span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {accounts.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 border border-dark/10 rounded-full pl-2 pr-1 py-1"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: accountColor(a) }}
                />
                <span className="font-sans text-sm text-dark">
                  {a.name}
                  {a.handle ? ` · @${a.handle}` : ""}
                </span>
                <span className="font-mono text-[9px] text-muted uppercase tracking-widest">
                  {PLATFORM_LABEL[a.platform] ?? a.platform}
                </span>
                <button
                  onClick={() => remove(a)}
                  disabled={pending}
                  className="w-5 h-5 flex items-center justify-center text-red-600 hover:bg-red-500/10 rounded-full text-xs disabled:opacity-40"
                  aria-label="Remove account"
                >
                  ×
                </button>
              </span>
            ))}
            {accounts.length === 0 && (
              <span className="font-sans text-sm text-muted">No accounts yet.</span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="account name (e.g. Goated Main)"
            />
            <input
              className={inputClass}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@handle"
            />
            <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABEL[p]}
                </option>
              ))}
            </select>
            <button
              onClick={add}
              disabled={pending || !name.trim()}
              className="px-4 py-2 bg-dark text-white rounded-full text-xs font-medium hover:bg-coral transition disabled:opacity-40"
            >
              Add
            </button>
          </div>
          {error && <p className="font-mono text-[11px] text-red-600 mt-2">{`// ${error}`}</p>}
        </div>
      )}
    </div>
  );
}
