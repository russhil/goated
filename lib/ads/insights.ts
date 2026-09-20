import type { AdStats } from "./rules";

// Read-only Meta Marketing API client for reporting. Never writes.

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0";

type Action = { action_type: string; value: string };

type InsightRow = {
  ad_id?: string;
  ad_name?: string;
  adset_name?: string;
  spend?: string;
  impressions?: string;
  inline_link_clicks?: string;
  actions?: Action[];
};

// Instant Form leads and pixel/CAPI website leads, without double counting
// the aggregate "lead" action that Meta also reports.
const LEAD_ACTIONS = ["onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];

function sumActions(actions: Action[] | undefined, types: string[]) {
  return (actions ?? [])
    .filter((a) => types.includes(a.action_type))
    .reduce((total, a) => total + Number(a.value || 0), 0);
}

export type InsightsResult =
  | { ok: true; ads: AdStats[] }
  | { ok: false; reason: "not_configured" | "api_error"; detail?: string };

export async function fetchAdInsights(datePreset = "last_30d"): Promise<InsightsResult> {
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token || !account) return { ok: false, reason: "not_configured" };

  const params = new URLSearchParams({
    level: "ad",
    date_preset: datePreset,
    fields: "ad_id,ad_name,adset_name,spend,impressions,inline_link_clicks,actions",
    limit: "100",
    access_token: token,
  });

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${account}/insights?${params}`,
      { cache: "no-store", signal: AbortSignal.timeout(10000) }
    );
    const body = (await res.json()) as { data?: InsightRow[]; error?: { message?: string } };
    if (!res.ok) return { ok: false, reason: "api_error", detail: body.error?.message };

    const ads = (body.data ?? []).map((row) => ({
      id: row.ad_id ?? "",
      name: row.ad_name ?? "",
      adsetName: row.adset_name ?? "",
      spend: Number(row.spend ?? 0),
      impressions: Number(row.impressions ?? 0),
      linkClicks: Number(row.inline_link_clicks ?? 0),
      landingPageViews: sumActions(row.actions, ["landing_page_view"]),
      leads: sumActions(row.actions, LEAD_ACTIONS),
    }));
    return { ok: true, ads };
  } catch (e) {
    return { ok: false, reason: "api_error", detail: e instanceof Error ? e.message : "unknown" };
  }
}
