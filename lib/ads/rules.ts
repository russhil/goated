// Phase 1 budget logic. Two signals per ad, evaluated the same way by the
// /hq/ads dashboard and the daily loop. Thresholds are proposals until a
// founder approves them; change them here only.
//
// Signal A: are people clicking the ad.
// Signal B: do clickers become leads.

export const THRESHOLDS = {
  // Below this, a CTR or lead rate is noise and no verdict is given.
  minImpressionsForA: 1500,
  minClicksForB: 60,
  ctrHealthyPct: 1.0,
  ctrDeadPct: 0.5,
  // Leads per 100 link clicks (website form + Instant Form).
  leadRateHealthyPct: 3,
  minLeadsForB: 2,
};

export type AdStats = {
  id: string;
  name: string;
  adsetName: string;
  spend: number;
  impressions: number;
  linkClicks: number;
  landingPageViews: number;
  leads: number;
};

export type Signal = "healthy" | "dead" | "learning";

export type Verdict = {
  signalA: Signal;
  signalB: Signal;
  diagnosis: "creative" | "page_or_offer" | "candidate" | "learning";
  action: string;
  ctrPct: number;
  cpc: number | null;
  leadRatePct: number;
  costPerLead: number | null;
};

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

export function evaluate(ad: AdStats): Verdict {
  const ctrPct = pct(ad.linkClicks, ad.impressions);
  const leadRatePct = pct(ad.leads, ad.linkClicks);

  let signalA: Signal = "learning";
  if (ad.impressions >= THRESHOLDS.minImpressionsForA) {
    if (ctrPct >= THRESHOLDS.ctrHealthyPct) signalA = "healthy";
    else if (ctrPct < THRESHOLDS.ctrDeadPct) signalA = "dead";
  }

  let signalB: Signal = "learning";
  if (ad.leads >= THRESHOLDS.minLeadsForB && leadRatePct >= THRESHOLDS.leadRateHealthyPct) {
    signalB = "healthy";
  } else if (ad.linkClicks >= THRESHOLDS.minClicksForB && ad.leads === 0) {
    signalB = "dead";
  }

  let diagnosis: Verdict["diagnosis"] = "learning";
  let action = "Hold spend. Keep collecting data.";
  if (signalA === "dead") {
    diagnosis = "creative";
    action = "Hold spend. Replace the hook.";
  } else if (signalA === "healthy" && signalB === "dead") {
    diagnosis = "page_or_offer";
    action = "Hold spend. Fix the page or the offer.";
  } else if (signalA === "healthy" && signalB === "healthy") {
    diagnosis = "candidate";
    action = "Both signals cleared. Propose concentrating budget here.";
  }

  return {
    signalA,
    signalB,
    diagnosis,
    action,
    ctrPct,
    cpc: ad.linkClicks > 0 ? ad.spend / ad.linkClicks : null,
    leadRatePct,
    costPerLead: ad.leads > 0 ? ad.spend / ad.leads : null,
  };
}
