// Centralized admin allowlist.
//
// Reads from ADMIN_EMAILS env var (comma-separated). Falls back to a hard-coded
// list of founders so the site keeps working even if env is missing.
const FALLBACK_ADMINS = [
  "alphaboyabg@gmail.com",
  "russhilchawla@gmail.com",
  "hello@goatedd.tech",
];

function getAdminEmails(): string[] {
  const fromEnv = process.env.ADMIN_EMAILS;
  if (!fromEnv) return FALLBACK_ADMINS;
  return fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
