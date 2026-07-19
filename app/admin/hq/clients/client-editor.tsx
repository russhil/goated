"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CURRENCIES,
  rollup,
  clientColor,
  formatMoney,
  inputClass,
  labelClass,
  type Client,
  type Subproject,
  type TeamMember,
  type Credential,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
import CredentialsEditor from "./credentials-editor";
import DocManager from "./doc-manager";
import {
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  deleteClient,
  type ClientInput,
} from "./actions";

// Full create/edit form for a single client. Used on the client detail page
// (edit mode) and inside the "new client" drawer (create mode). Sub-projects
// are managed separately on the detail page, so they're not rendered here.
export default function ClientEditor({
  client,
  subprojects = [],
  team,
  onSaved,
}: {
  client?: Client;
  subprojects?: Subproject[];
  team: TeamMember[];
  onSaved?: () => void;
}) {
  const isNew = !client;
  const router = useRouter();

  const [name, setName] = useState(client?.name ?? "");
  const [industry, setIndustry] = useState(client?.industry ?? "");
  const [currency, setCurrency] = useState(client?.currency ?? "INR");
  const [githubUrl, setGithubUrl] = useState(client?.github_url ?? "");
  const [dbUrl, setDbUrl] = useState(client?.db_url ?? "");
  const [liveUrl, setLiveUrl] = useState(client?.live_url ?? "");
  const [description, setDescription] = useState(client?.description ?? "");
  const [story, setStory] = useState(client?.story ?? "");
  // Default the picker to the client's stable fallback color so an unset color
  // isn't silently rewritten to coral on the next save.
  const [color, setColor] = useState(
    client?.color ?? (client?.id ? clientColor({ id: client.id, color: null }) : "#E8533A")
  );
  const [kickoffDate, setKickoffDate] = useState(client?.kickoff_date ?? "");
  const [credentials, setCredentials] = useState<Credential[]>(
    client?.credentials ?? []
  );
  const [contributorIds, setContributorIds] = useState<string[]>(
    client?.contributor_ids ?? []
  );

  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const roll = rollup(subprojects);

  const buildInput = (): ClientInput => ({
    name,
    industry,
    currency,
    github_url: githubUrl,
    db_url: dbUrl,
    live_url: liveUrl,
    description,
    story,
    color,
    kickoff_date: kickoffDate,
    credentials,
    contributor_ids: contributorIds,
  });

  const resetForm = () => {
    setName("");
    setIndustry("");
    setCurrency("INR");
    setGithubUrl("");
    setDbUrl("");
    setLiveUrl("");
    setDescription("");
    setStory("");
    setColor("#E8533A");
    setKickoffDate("");
    setCredentials([]);
    setContributorIds([]);
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const res = isNew
        ? await createClient(buildInput())
        : await updateClient(client!.id, buildInput());
      if (res.ok) {
        setSavedAt(Date.now());
        if (isNew) resetForm();
        router.refresh();
        onSaved?.();
      } else {
        setError(res.error || "save failed");
      }
    });
  };

  const handleArchive = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await archiveClient(client.id);
      if (res.ok) router.push("/admin/hq/clients");
      else setError(res.error || "archive failed");
    });
  };

  const handleRestore = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await restoreClient(client.id);
      if (res.ok) router.refresh();
      else setError(res.error || "restore failed");
    });
  };

  const handleDelete = () => {
    if (!client) return;
    if (
      !window.confirm(
        `Permanently delete "${client.name}" and all its sub-projects? This cannot be undone.`
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteClient(client.id);
      if (res.ok) router.push("/admin/hq/clients");
      else setError(res.error || "delete failed");
    });
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>// client name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
        </div>
        <div>
          <label className={labelClass}>// industry</label>
          <input className={inputClass} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Fintech" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className={labelClass}>// currency</label>
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>// chart color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded-lg border border-dark/10 bg-white cursor-pointer"
            />
            <span className="font-mono text-[11px] text-muted">{color}</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>// kickoff date</label>
          <input type="date" className={inputClass} value={kickoffDate} onChange={(e) => setKickoffDate(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end">
          <span className="font-mono text-[10px] text-muted uppercase tracking-widest">// profit (contract − cost)</span>
          <span className="font-sans text-sm text-dark">
            {formatMoney(roll.totalContract - roll.cost, currency)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className={labelClass}>// github link</label>
          <input className={inputClass} value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
        </div>
        <div>
          <label className={labelClass}>// db link</label>
          <input className={inputClass} value={dbUrl} onChange={(e) => setDbUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className={labelClass}>// live link</label>
          <input className={inputClass} value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelClass}>// description</label>
        <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="mb-4">
        <label className={labelClass}>// story / progress notes</label>
        <textarea className={`${inputClass} resize-none`} rows={3} value={story} onChange={(e) => setStory(e.target.value)} />
      </div>

      <div className="mb-5">
        <ContributorPicker team={team} value={contributorIds} onChange={setContributorIds} />
      </div>

      <CredentialsEditor value={credentials} onChange={setCredentials} />

      {!isNew && (
        <DocManager
          clientId={client!.id}
          hasNda={Boolean(client!.nda_path)}
          hasContract={Boolean(client!.contract_path)}
        />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={pending || name.trim() === ""}
            className="px-5 py-2 bg-dark text-white font-sans text-xs font-medium rounded-full hover:bg-coral transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "Saving..." : isNew ? "Create client" : "Save changes"}
          </button>
          {savedAt && !error && (
            <span className="font-mono text-[11px] text-emerald-700">
              {isNew ? "// created" : "// saved"}
            </span>
          )}
          {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
        </div>
        {!isNew && (
          <div className="flex items-center gap-4">
            {client!.archived ? (
              <button onClick={handleRestore} disabled={pending} className="font-mono text-[11px] text-emerald-700 hover:underline disabled:opacity-40">
                restore
              </button>
            ) : (
              <button onClick={handleArchive} disabled={pending} className="font-mono text-[11px] text-dark/60 hover:underline disabled:opacity-40">
                archive
              </button>
            )}
            <button onClick={handleDelete} disabled={pending} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
              delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
