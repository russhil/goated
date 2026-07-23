// HQ permission model (pure — no DB, no server-only imports, safe on the client).
//
// Each member has a Permissions object. Owners bypass all of this (full access,
// see lib/hq-data resolveHqUser). "Financials" is the money-visibility switch;
// managing clients implies seeing money (you can't edit phase amounts blind),
// so canSeeFinancials() is true for financials OR clients:manage.

export type Level = "none" | "view" | "manage";

// Sections that use the none/view/manage scale.
export type Section = "clients" | "prospects" | "expenses" | "pettyCash" | "content";

export type Permissions = {
  dashboard: boolean; // can see the main /hq dashboard (default on)
  financials: boolean;
  clients: Level;
  prospects: Level;
  expenses: Level;
  pettyCash: Level;
  content: Level;
  users: boolean;
};

export const OWNER_FALLBACK = [
  "alphaboyabg@gmail.com",
  "russhilchawla@gmail.com",
  "hello@goatedd.tech",
];

export const OWNER_PERMISSIONS: Permissions = {
  dashboard: true,
  financials: true,
  clients: "manage",
  prospects: "manage",
  expenses: "manage",
  pettyCash: "manage",
  content: "manage",
  users: true,
};

export const NO_PERMISSIONS: Permissions = {
  dashboard: false,
  financials: false,
  clients: "none",
  prospects: "none",
  expenses: "none",
  pettyCash: "none",
  content: "none",
  users: false,
};

// One-click presets for the Users panel.
export const PRESETS: Record<string, { label: string; perms: Permissions }> = {
  full: { label: "Full access", perms: { ...OWNER_PERMISSIONS } },
  sales: {
    label: "Sales",
    perms: {
      dashboard: true,
      financials: false,
      clients: "view",
      prospects: "manage",
      expenses: "manage",
      pettyCash: "none",
      content: "none",
      users: false,
    },
  },
  content: {
    label: "Content",
    perms: {
      dashboard: true,
      financials: false,
      clients: "view",
      prospects: "none",
      expenses: "none",
      pettyCash: "none",
      content: "manage",
      users: false,
    },
  },
  viewer: {
    label: "Viewer",
    perms: {
      dashboard: true,
      financials: false,
      clients: "view",
      prospects: "view",
      expenses: "none",
      pettyCash: "none",
      content: "view",
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
    // Default ON so existing members keep the dashboard; only an explicit false hides it.
    dashboard: o.dashboard !== false,
    financials: o.financials === true,
    clients: level(o.clients),
    prospects: level(o.prospects),
    expenses: level(o.expenses),
    pettyCash: level(o.pettyCash),
    content: level(o.content),
    users: o.users === true,
  };
}

export function canViewDashboard(p: Permissions): boolean {
  return p.dashboard;
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

// First tab this member can open — where to send someone whose dashboard is
// hidden (or as a generic landing). Null if they can open nothing but the
// dashboard is off (shouldn't normally happen).
export function firstAccessibleRoute(p: Permissions): string | null {
  if (canViewDashboard(p)) return "/hq";
  if (canView(p, "clients")) return "/hq/clients";
  if (canView(p, "prospects")) return "/hq/prospects";
  if (canView(p, "content")) return "/hq/content";
  if (canViewFinanceTab(p)) return "/hq/finance";
  if (canManageUsers(p)) return "/hq/users";
  return null;
}
