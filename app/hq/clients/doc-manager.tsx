"use client";

import { useRef, useState } from "react";
import { labelClass } from "@/lib/hq";
import { uploadClientDoc, getClientDocUrl, removeClientDoc } from "./actions";

function DocSlot({
  clientId,
  kind,
  label,
  hasDoc,
}: {
  clientId: string;
  kind: "nda" | "contract";
  label: string;
  hasDoc: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setError("");
    setBusy(true);
    const fd = new FormData();
    fd.append("clientId", clientId);
    fd.append("kind", kind);
    fd.append("file", file);
    const res = await uploadClientDoc(fd);
    setBusy(false);
    if (!res.ok) setError(res.error || "upload failed");
    if (fileRef.current) fileRef.current.value = "";
  };

  const view = async () => {
    setError("");
    const res = await getClientDocUrl(clientId, kind);
    if (res.ok && res.url) window.open(res.url, "_blank", "noopener,noreferrer");
    else setError(res.error || "could not open");
  };

  const remove = async () => {
    if (!window.confirm(`Remove the ${label}?`)) return;
    setError("");
    setBusy(true);
    const res = await removeClientDoc(clientId, kind);
    setBusy(false);
    if (!res.ok) setError(res.error || "remove failed");
  };

  return (
    <div>
      <label className={labelClass}>{`// ${label}`}</label>
      <div className="flex items-center gap-3 flex-wrap">
        {hasDoc && (
          <>
            <button type="button" onClick={view} className="font-mono text-[11px] text-coral hover:underline">
              view (signed)
            </button>
            <button type="button" onClick={remove} disabled={busy} className="font-mono text-[11px] text-red-600 hover:underline disabled:opacity-40">
              remove
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
          className="font-mono text-xs text-muted"
        />
        {busy && <span className="font-mono text-[11px] text-muted">// working…</span>}
        {error && <span className="font-mono text-[11px] text-red-600">{`// ${error}`}</span>}
      </div>
    </div>
  );
}

export default function DocManager({
  clientId,
  hasNda,
  hasContract,
}: {
  clientId: string;
  hasNda: boolean;
  hasContract: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
      <DocSlot clientId={clientId} kind="nda" label="NDA (PDF)" hasDoc={hasNda} />
      <DocSlot clientId={clientId} kind="contract" label="Contract (PDF)" hasDoc={hasContract} />
    </div>
  );
}
