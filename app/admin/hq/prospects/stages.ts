// Sales-pipeline stage vocabulary. Kept in a plain module (NOT the "use server"
// actions file, which may only export async functions) so the server page and
// the client board/list/form can all share the labels + ordering.

export const STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

export type Stage = (typeof STAGES)[number];

// Ordered friendly labels, indexed by the array position above so ◀/▶ moves
// walk the pipeline left→right.
export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export function isStage(v: string): v is Stage {
  return (STAGES as readonly string[]).includes(v);
}

export type Prospect = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  stage: Stage;
  est_value: number;
  currency: string;
  notes: string | null;
  sort_order: number;
  reached_out: boolean;
  reached_out_on: string | null;
  responded: boolean;
  next_followup_at: string | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SalesMetrics = {
  reachedOut: number;
  responded: number;
  won: number;
  replyRate: number; // headline "conversion" — responded / reached-out
  closeRate: number; // won / reached-out
  avgPerDay: number; // reach-outs per calendar day since the first one
  reachedThisWeek: number;
  followupsDue: number;
};

// Top-of-funnel outreach metrics for the Prospects dashboard. Reply rate is the
// headline; close rate, throughput and follow-up load ride alongside it.
export function salesMetrics(prospects: Prospect[]): SalesMetrics {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const reached = prospects.filter((p) => p.reached_out);
  const reachedOut = reached.length;
  const responded = prospects.filter((p) => p.responded).length;
  const won = prospects.filter((p) => p.stage === "won").length;

  const dates = reached
    .map((p) => (p.reached_out_on ? new Date(p.reached_out_on).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  let avgPerDay = 0;
  if (dates.length > 0) {
    const earliest = Math.min(...dates);
    const spanDays = Math.max(1, Math.ceil((now - earliest) / 86_400_000));
    avgPerDay = reachedOut / spanDays;
  }

  const reachedThisWeek = dates.filter((t) => t >= weekAgo).length;

  const followupsDue = prospects.filter(
    (p) =>
      p.stage !== "won" &&
      p.stage !== "lost" &&
      p.next_followup_at !== null &&
      new Date(p.next_followup_at).getTime() <= now
  ).length;

  return {
    reachedOut,
    responded,
    won,
    replyRate: reachedOut > 0 ? Math.round((responded / reachedOut) * 100) : 0,
    closeRate: reachedOut > 0 ? Math.round((won / reachedOut) * 100) : 0,
    avgPerDay: Math.round(avgPerDay * 10) / 10,
    reachedThisWeek,
    followupsDue,
  };
}
