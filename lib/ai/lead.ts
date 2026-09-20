// Lead qualification shared by the /ai form, its API route and the Meta
// Instant Form webhook. Pure functions: safe on client and server.

export const REVENUE_BANDS = [
  { value: "under_5cr", label: "Under ₹5 Cr" },
  { value: "5_25cr", label: "₹5 Cr to ₹25 Cr" },
  { value: "25_100cr", label: "₹25 Cr to ₹100 Cr" },
  { value: "over_100cr", label: "Above ₹100 Cr" },
] as const;

export type RevenueBand = (typeof REVENUE_BANDS)[number]["value"];

// Consumer mailbox providers. A lead on one of these is not a company email.
const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.in", "yahoo.co.in", "yahoo.co.uk",
  "ymail.com", "rocketmail.com", "hotmail.com", "hotmail.co.uk", "hotmail.in",
  "outlook.com", "outlook.in", "live.com", "live.in", "msn.com", "icloud.com", "me.com",
  "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "zoho.com", "zohomail.in",
  "rediffmail.com", "rediff.com", "mail.com", "gmx.com", "gmx.net", "yandex.com",
  "yandex.ru", "tutanota.com", "tuta.io", "fastmail.com", "hey.com", "inbox.com",
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "yopmail.com",
]);

const EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/;

export function emailDomain(email: string): string | null {
  const match = email.trim().toLowerCase().match(EMAIL_RE);
  return match ? match[1] : null;
}

export function isCompanyEmail(email: string): boolean {
  const domain = emailDomain(email);
  return domain !== null && !FREE_MAIL.has(domain);
}

export type LeadInput = {
  name: string;
  email: string;
  company: string;
  phone: string;
  revenueBand: string;
};

export type LeadErrors = Partial<Record<keyof LeadInput, string>>;

export function validateLead(input: LeadInput): LeadErrors {
  const errors: LeadErrors = {};
  const name = input.name.trim();
  if (name.length < 2 || name.length > 100) errors.name = "Enter your name.";

  if (!emailDomain(input.email)) errors.email = "Enter a valid email address.";
  else if (!isCompanyEmail(input.email)) errors.email = "Use a company email address.";

  const company = input.company.trim();
  if (company.length < 2 || company.length > 120) errors.company = "Enter your company name.";

  const digits = input.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) errors.phone = "Enter a valid phone number.";

  if (!REVENUE_BANDS.some((b) => b.value === input.revenueBand)) {
    errors.revenueBand = "Select a revenue range.";
  }
  return errors;
}

// The page targets ₹25 Cr and above; smaller companies are kept but marked.
export function isTargetRevenue(band: string): boolean {
  return band === "25_100cr" || band === "over_100cr";
}
