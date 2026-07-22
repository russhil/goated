// HQ permission model (pure — no DB, no server-only imports, safe on the client).
//
// Each member has a Permissions object. Owners bypass all of this (full access,
// see lib/hq-data resolveHqUser). "Financials" is the money-visibility switch;
// managing clients implies seeing money (you can't edit phase amounts blind),
// so canSeeFinancials() is true for financials OR clients:manage.

export type Level = "none" | "view" | "manage";

// Sections that use the none/view/manage scale.
export type Section = "clients" | "prospects" | "expenses" | "pettyCash";

export type Permissions = {
  financials: boolean;
  clients: Level;
  prospects: Level;
  expenses: Level;
  pettyCash: Level;
  users: boolean;
};

export const OWNER_FALLBACK = [
  "alphaboyabg@gmail.com",
  "russhilchawla@gmail.com",
  "hello@goatedd.tech",
];

export const OWNER_PERMISSIONS: Permissions = {
  financials: true,
  clients: "manage",
  prospects: "manage",
  expenses: "manage",
  pettyCash: "manage",
  users: true,
};

export const NO_PERMISSIONS: Permissions = {
  financials: false,
  clients: "none",
  prospects: "none",
  expenses: "none",
  pettyCash: "none",
  users: false,
};

// One-click presets for the Users panel.
export const PRESETS: Record<string, { label: string; perms: Permissions }> = {
  full: { label: "Full access", perms: { ...OWNER_PERMISSIONS } },
  sales: {
    label: "Sales",
    perms: {
      financials: false,
      clients: "view",
      prospects: "manage",
      expenses: "manage",
      pettyCash: "none",
      users: false,
    },
  },
  viewer: {
    label: "Viewer",
    perms: {
      financials: false,
      clients: "view",
      prospects: "view",
      expenses: "none",
      pettyCash: "none",
      users: false,
    },
  },
  none: { label: "No access", perms: { ...NO_PERMISSIONS } },
};

const LEVELS: Level[] = ["none", "view", "manage"];

function level(v: unknown): Level {
  return typeof v === "string" && (LEVELS as string[]).includes(v) ? (v as Level) : "none";
}

// Coerce whatever is stored in the jsonb column into a well-formed Permissions.
export function normalizePermissions(raw: unknown): Permissions {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    financials: o.financials === true,
    clients: level(o.clients),
    prospects: level(o.prospects),
    expenses: level(o.expenses),
    pettyCash: level(o.pettyCash),
    users: o.users === true,
  };
}

export function canView(p: Permissions, s: Section): boolean {
  return p[s] === "view" || p[s] === "manage";
}

export function canManage(p: Permissions, s: Section): boolean {
  return p[s] === "manage";
}

export function canManageUsers(p: Permissions): boolean {
  return p.users;
}

// Money visibility: the Financials switch, OR clients:manage (editing phases
// inherently exposes amounts).
export function canSeeFinancials(p: Permissions): boolean {
  return p.financials || p.clients === "manage";
}

// The Finance tab shows up if any of its cards are visible.
export function canViewFinanceTab(p: Permissions): boolean {
  return canSeeFinancials(p) || canView(p, "expenses") || canView(p, "pettyCash");
}

// Is there anything at all this member can open? (Dashboard is always available
// to a member, so membership alone is enough — kept for symmetry/future use.)
export function hasAnyAccess(_p: Permissions): boolean {
  return true;
}
