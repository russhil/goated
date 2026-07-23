// Content-pipeline vocabulary. Plain module (NOT "use server") so the server
// page and the client calendar/list/form can all share it. Kept in sync with
// the check constraints on content_items (schema §24).

export const KINDS = ["reel", "video", "short", "post", "carousel", "story"] as const;
export type Kind = (typeof KINDS)[number];

export const PLATFORMS = ["instagram", "youtube", "tiktok", "linkedin", "x", "other"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const STATUSES = ["idea", "scripting", "filming", "editing", "scheduled", "posted"] as const;
export type Status = (typeof STATUSES)[number];

export const KIND_EMOJI: Record<string, string> = {
  reel: "🎥",
  video: "🎬",
  short: "⚡",
  post: "🖼️",
  carousel: "🎠",
  story: "📖",
};

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
  other: "Other",
};

export const STATUS_LABEL: Record<string, string> = {
  idea: "Idea",
  scripting: "Scripting",
  filming: "Filming",
  editing: "Editing",
  scheduled: "Scheduled",
  posted: "Posted",
};

export const STATUS_CHIP: Record<string, string> = {
  idea: "text-dark/60 bg-dark/[0.06]",
  scripting: "text-amber-700 bg-amber-500/10",
  filming: "text-blue-700 bg-blue-500/10",
  editing: "text-violet-700 bg-violet-500/10",
  scheduled: "text-coral bg-coral/10",
  posted: "text-emerald-700 bg-emerald-500/10",
};

export function isKind(v: string): v is Kind {
  return (KINDS as readonly string[]).includes(v);
}
export function isPlatform(v: string): v is Platform {
  return (PLATFORMS as readonly string[]).includes(v);
}
export function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}

export type ContentItem = {
  id: string;
  title: string;
  kind: string;
  platform: string;
  status: string;
  scheduled_at: string | null;
  topic: string | null;
  notes: string | null;
  link: string | null;
  account_id: string | null;
  starred: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentAccount = {
  id: string;
  name: string;
  handle: string | null;
  platform: string;
  color: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// Distinct, theme-safe palette for account color dots on the calendar.
export const ACCOUNT_COLORS = [
  "#E8533A",
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#14b8a6",
  "#8b5cf6",
  "#3b82f6",
];

// Stable fallback color for an account without one (hash by id, not list index).
export function accountColor(acc: { id: string; color: string | null }): string {
  if (acc.color) return acc.color;
  let h = 0;
  for (let i = 0; i < acc.id.length; i++) h = (h * 31 + acc.id.charCodeAt(i)) | 0;
  return ACCOUNT_COLORS[Math.abs(h) % ACCOUNT_COLORS.length];
}

// Timezone-pinned formatters (IST) so server (UTC) and client render identically
// — no hydration mismatch from a floating local timezone.
const IST = "Asia/Kolkata";

// Group key: the IST calendar date, e.g. "2026-07-28".
export function istDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function istDayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: IST,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function istTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
