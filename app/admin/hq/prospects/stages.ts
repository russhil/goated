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
  created_at: string;
  updated_at: string;
};
