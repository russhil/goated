"use client";

import { createContext, useContext } from "react";
import type { Permissions } from "@/lib/hq-perms";

// Makes the signed-in member's permissions available to client components so
// they can hide controls they can't use. Enforcement still happens server-side
// (guard + redaction) — this is purely for UX.
const PermsContext = createContext<Permissions | null>(null);

export function PermsProvider({
  perms,
  children,
}: {
  perms: Permissions;
  children: React.ReactNode;
}) {
  return <PermsContext.Provider value={perms}>{children}</PermsContext.Provider>;
}

export function usePerms(): Permissions {
  const ctx = useContext(PermsContext);
  if (!ctx) throw new Error("usePerms must be used within <PermsProvider>");
  return ctx;
}
