"use client";

import { useState, useTransition } from "react";
import {
  CURRENCIES,
  rollup,
  healthColor,
  HEALTH_DOT,
  HEALTH_LABEL,
  formatMoney,
  inputClass,
  labelClass,
  type Client,
  type Subproject,
  type TeamMember,
  type Credential,
} from "@/lib/hq";
import ContributorPicker from "./contributor-picker";
import SubprojectRow from "./subproject-row";
import {
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  deleteClient,
  type ClientInput,
} from "./actions";

export default function ClientRow({
  client,
  subprojects = [],
  team,
}: {
  client?: Client;
  subprojects?: Subproject[];
  team: TeamMember[];
}) {
  const isNew = !client;
  const [expanded, setExpanded] = useState(isNew);

  const [name, setName] = useState(client?.name ?? "");
  const [industry, setIndustry] = useState(client?.industry ?? "");
  const [currency, setCurrency] = useState(client?.currency ?? "INR");
  const [githubUrl, setGithubUrl] = useState(client?.github_url ?? "");
  const [dbUrl, setDbUrl] = useState(client?.db_url ?? "");
  const [liveUrl, setLiveUrl] = useState(client?.live_url ?? "");
  const [description, setDescription] = useState(client?.description ?? "");
  const [story, setStory] = useState(client?.story ?? "");
  const [cost, setCost] = useState(client?.cost ?? 0);
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
  const health = healthColor(roll.progress, roll.count);

  const buildInput = (): ClientInput => ({
    name,
    industry,
    currency,
    github_url: githubUrl,
    db_url: dbUrl,
    live_url: liveUrl,
    description,
    story,
    cost: Number(cost) || 0,
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
    setCost(0);
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
      } else {
        setError(res.error || "save failed");
      }
    });
  };

  const handleArchive = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await archiveClient(client.id);
      if (!res.ok) setError(res.error || "archive failed");
    });
  };

  const handleRestore = () => {
    if (!client) return;
    startTransition(async () => {
      const res = await restoreClient(client.id);
      if (!res.ok) setError(res.error || "restore failed");
    });
  };

  const handleDelete = () => {
    if (!client) return;
    if (!window.confirm(`Permanently delete "${client.name}" and all its sub-projects? This cannot be undone.`))
      return;
    startTransition(async () => {
      const res = await deleteClient(client.id);
      if (!res.ok) setError(res.error || "delete failed");
    });
  };

  return (
    <li className="border border-dark/10 rounded-2xl bg-white overflow-hidden">
      {/* Collapsed summary — priority order left→right */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-6 py-4 flex items-center gap-4 flex-wrap hover:bg-dark/[0.02]"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${HEALTH_DOT[health]}`}
          title={HEALTH_LABEL[health]}
        />
        <span className="font-serif text-lg text-dark min-w-[140px]">
          {isNew ? "New client" : client!.name}
        </span>
        {!isNew && (
          <>
            <span className="font-mono text-[11px] text-muted uppercase tracking-widest min-w-[90px]">
              {client!.industry || "—"}
            </span>
            <span className="font-sans text-sm text-dark">
              {formatMoney(roll.totalContract, currency)}
              <span className="text-muted"> contract</span>
            </span>
            <span className="font-sans text-sm text-dark">
              {formatMoney(roll.collected, currency)}
              <span className="text-muted"> collected</span>
            </span>
            <span className="font-sans text-sm text-coral">
              {formatMoney(roll.outstanding, currency)}
              <span className="text-muted"> outstanding</span>
            </span>
            <span className="font-mono text-xs text-dark">{roll.progress}%</span>
            <span className="font-mono text-[11px] text-muted ml-auto">
              {client!.kickoff_date || "no kickoff"}
            </span>
          </>
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-dark/10">
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
              <label className={labelClass}>// cost of project</label>
              <input type="number" className={inputClass} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>// kickoff date</label>
              <input type="date" className={inputClass} value={kickoffDate} onChange={(e) => setKickoffDate(e.target.value)} />
            </div>
            <div className="flex flex-col justify-end">
              <span className="font-mono text-[10px] text-muted uppercase tracking-widest">// profit (contract − cost)</span>
              <span className="font-sans text-sm text-dark">
                {formatMoney(roll.totalContract - (Number(cost) || 0), currency)}
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

          {/* CREDENTIALS_SLOT — replaced in Task 7 */}
          {!isNew && (
            <div className="mb-5">
              <p className="font-mono text-[11px] text-coral uppercase tracking-widest mb-3">
                {`// sub-projects (${roll.count})`}
              </p>
              <div className="flex flex-col gap-3">
                {subprojects.map((sp) => (
                  <SubprojectRow
                    key={sp.id}
                    clientId={client!.id}
                    subproject={sp}
                    team={team}
                    currency={currency}
                  />
                ))}
                <SubprojectRow clientId={client!.id} team={team} currency={currency} />
              </div>
            </div>
          )}
          {/* PDF_SLOT — replaced in Task 8 */}

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
      )}
    </li>
  );
}
