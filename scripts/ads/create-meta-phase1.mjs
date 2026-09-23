// Creates the Phase 1 Meta objects. EVERYTHING IS CREATED PAUSED and nothing
// spends until a human activates it in Ads Manager.
//
// Run: node scripts/ads/create-meta-phase1.mjs
// Re-running creates duplicates; it is meant to run once. Ids land in
// ads/live/meta-phase1.json and every call is appended to ads/audit-log.jsonl.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v25.0"}`;

// Secrets: GOATED_ADS_ENV if set, then the VPS path, then the laptop path.
// Missing files are skipped, so systemd's EnvironmentFile alone also works.
for (const file of [process.env.GOATED_ADS_ENV, "/opt/goated-ads/.env", join(homedir(), ".config", "goated-ads", "meta.env")]) {
  if (!file || !existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const TOKEN = process.env.META_ACCESS_TOKEN;
const PAGE_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const ACCOUNT = process.env.META_AD_ACCOUNT_ID;
const PAGE = process.env.META_PAGE_ID;
const PBIA = process.env.META_PBIA_ID;
const PIXEL = process.env.META_PIXEL_ID;

// Concentrated, not spread: the same money over fewer days buys denser data.
// At Rs 166/day a whole week can pass with one lead, which tells us nothing.
const DAILY_BUDGET_PAISE = 10000; // Rs 100/day PER AD SET, so Rs 300/day across three
const DAYS = 3;                   // Rs 900 total across the three cells
// Meta refuses a campaign spending limit below Rs 5,000, so this is a backstop,
// not the intended cap. Rs 100/day x a 30-day end date is what holds spend to
// ~Rs 3,000; the account spending limit (set by hand in Billing) is the only
// hard stop Meta cannot exceed.
const SPEND_CAP_PAISE = 500000; // Rs 5,000, also Meta's minimum campaign cap
const SITE = "https://goatedd.tech";

const log = (action, detail, extra = {}) =>
  appendFileSync(
    join(ROOT, "ads", "audit-log.jsonl"),
    JSON.stringify({
      ts: new Date().toISOString(),
      actor: "claude",
      action,
      detail,
      approved_by: "founder: 'start testing campaign today on meta' (2026-09-21)",
      spend_change_inr: 0,
      ...extra,
    }) + "\n"
  );

async function api(path, body, token = TOKEN) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  form.append("access_token", token);
  const res = await fetch(`${GRAPH}/${path}`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`${path}: ${json.error?.error_user_msg || json.error?.message || res.status}`);
  }
  return json;
}

async function uploadImage(file) {
  const bytes = readFileSync(join(ROOT, file));
  const form = new FormData();
  form.append("filename", new Blob([bytes], { type: "image/png" }), basename(file));
  form.append("access_token", TOKEN);
  const res = await fetch(`${GRAPH}/${ACCOUNT}/adimages`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(`adimages: ${json.error?.message}`);
  const key = Object.keys(json.images)[0];
  return json.images[key].hash;
}

const ADS = [
  {
    name: "AD1 | AI replaces 30% of staff",
    cell: "staff-30pc",
    image: "ads/creatives/out-v3/staff-4x5.png",
    message:
      "One client had 15 people in one team. Today 3 people do that work, with AI.\n\nThat's \u20b93.6 lakh saved every month. Over \u20b940 lakh in a year, from one team alone.\n\nWe built it in 6 weeks. Free 30-minute call, for businesses above \u20b925 Cr.",
    headline: "AI can replace up to 30% of your staff.",
    description: "Free 30-minute call",
  },
  {
    name: "AD2 | AI saves Rs 3.6 lakh a month",
    cell: "salary-3.6L",
    image: "ads/creatives/out-v3/salary-4x5.png",
    message:
      "One client was paying 12 people to do work AI now does. Same output. Same customers.\n\n\u20b93.6 lakh saved every month. Over \u20b940 lakh in the first year, and that's one team.\n\nBuilt in 6 weeks. Free 30-minute call, for businesses above \u20b925 Cr.",
    headline: "AI can save you \u20b93.6 lakh every month.",
    description: "Free 30-minute call",
  },
  {
    name: "AD3 | still paying for data entry",
    cell: "data-entry",
    image: "ads/creatives/out-v3/dataentry-4x5.png",
    message:
      "Your staff types orders, bills and reports into the computer all day. AI does the same work for about a tenth of the cost.\n\nOne client saves \u20b93.6 lakh every month. Over \u20b940 lakh in a year.\n\nFree 30-minute call, for businesses above \u20b925 Cr.",
    headline: "Still paying salaries for data entry?",
    description: "Free 30-minute call",
  },
];

const TARGETING = {
  // The states that hold most of India's manufacturing, distribution and
  // trading businesses. Nationwide reach at this budget wastes impressions in
  // places with few Rs 25 Cr+ operating companies.
  geo_locations: {
    regions: [
      { key: "1735" }, // Maharashtra
      { key: "1729" }, // Gujarat
      { key: "1728" }, // Delhi
      { key: "1730" }, // Haryana
      { key: "1744" }, // Tamil Nadu
      { key: "1738" }, // Karnataka
      { key: "1754" }, // Uttar Pradesh
      { key: "1742" }, // Punjab
      { key: "1743" }, // Rajasthan
      { key: "4100" }, // Telangana
      { key: "1746" }, // West Bengal
    ],
  },
  genders: [1], // men
  age_min: 35,
  age_max: 65, // owners of established Indian businesses run well past 60
  flexible_spec: [
    {
      interests: [
        { id: "6003210541324", name: "Enterprise resource planning" },
        { id: "6002947589355", name: "Supply chain management" },
        { id: "6003374398954", name: "Manufacturing" },
        { id: "6002884511422", name: "Small business" },
        { id: "6003371567474", name: "Entrepreneurship" },
        { id: "962870357067624", name: "SAP SE" },
        { id: "6003165841322", name: "Distribution (business)" },
      ],
      behaviors: [
        { id: "6002714898572", name: "Small business owners" },
        { id: "6020530281783", name: "Business Page admins" },
        { id: "6015683810783", name: "Facebook Page admins" },
      ],
    },
  ],
  publisher_platforms: ["facebook", "instagram"],
  // Marketplace and Search are dropped: accidental taps from shoppers, not owners.
  facebook_positions: ["feed", "story", "facebook_reels"],
  instagram_positions: ["stream", "story", "reels"],
  // Advantage+ audience OFF: age and gender stay hard limits, not suggestions.
  targeting_automation: { advantage_audience: 0 },
};

async function main() {
  for (const [k, v] of Object.entries({ TOKEN, PAGE_TOKEN, ACCOUNT, PAGE, PBIA })) {
    if (!v) throw new Error(`missing ${k}`);
  }
  const out = { created_at: new Date().toISOString() };

  // 1. Instant Form. Higher intent adds a review step before submit.
  // Reuse one with the same name so a re-run does not create duplicates.
  // v2 (2026-09-21): office-photo header via context_card.cover_photo_id, AI intro.
// v3 (2026-09-22): plain EMAIL again; WORK_EMAIL blocked owners on phones
// (founder: "disable work email on lead form").
// v4 (2026-09-23): thank-you button goes to /thankyou, which says a founder
// will be in touch and offers the calendar instead of forcing it.
// Forms are frozen once ads use them, so a change means a new form name; this
// script then swaps every ad onto it.
const FORM_NAME = "GOATED | AI automation | Phase 1 v4";
  const existing = await fetch(
    `${GRAPH}/${PAGE}/leadgen_forms?fields=id,name,status&limit=50&access_token=${encodeURIComponent(PAGE_TOKEN)}`
  ).then((r) => r.json());
  const reuse = (existing.data || []).find((f) => f.name === FORM_NAME);
  const form = reuse ? (console.log("reusing form", reuse.id), reuse) : await api(
    `${PAGE}/leadgen_forms`,
    {
      name: FORM_NAME,
      locale: "en_US",
      is_optimized_for_quality: true,
      block_display_for_non_targeted_viewer: true,
      privacy_policy: { url: `${SITE}/privacy`, link_text: "Privacy policy" },
      context_card: {
        title: "AI automation for businesses above ₹25 Cr",
        style: "LIST_STYLE",
        content: [
          "AI does the work your team repeats every day",
          "One client saves ₹3.6 lakh every month",
          "Software built and live in 6 weeks",
        ],
        button_text: "Continue",
        // Unpublished page photo (the office shot) used as the form header.
        cover_photo_id: "122104788435479293",
      },
      questions: [
        { type: "FULL_NAME" },
        { type: "EMAIL" },
        { type: "COMPANY_NAME" },
        { type: "PHONE" },
        {
          type: "CUSTOM",
          key: "annual_revenue",
          label: "Annual revenue",
          options: [
            { key: "under_5cr", value: "Under ₹5 Cr" },
            { key: "5_25cr", value: "₹5 Cr to ₹25 Cr" },
            { key: "25_100cr", value: "₹25 Cr to ₹100 Cr" },
            { key: "over_100cr", value: "Above ₹100 Cr" },
          ],
        },
      ],
      thank_you_page: {
        title: "Thank you, we have your details.",
        body: "A founder will get back to you on WhatsApp, phone or email.",
        button_type: "VIEW_WEBSITE",
        button_text: "Schedule a call",
        website_url: `${SITE}/thankyou?utm_source=meta&utm_medium=instant_form&utm_campaign=phase1`,
      },
      follow_up_action_url: `${SITE}/thankyou?utm_source=meta&utm_medium=instant_form&utm_campaign=phase1`,
    },
    PAGE_TOKEN
  );
  out.form_id = form.id;
  log("meta_form_created", `Instant Form ${form.id}`);
  console.log("form", form.id);

  // 2. Campaign, paused, with a lifetime spend cap.
  const CAMPAIGN_NAME = "GOATED | Phase 1 | Leads | IN";
  const camps = await fetch(
    `${GRAPH}/${ACCOUNT}/campaigns?fields=id,name&limit=100&access_token=${encodeURIComponent(TOKEN)}`
  ).then((r) => r.json());
  const camp = (camps.data || []).find((c) => c.name === CAMPAIGN_NAME);
  const campaign = camp ? (console.log("reusing campaign", camp.id), camp) : await api(`${ACCOUNT}/campaigns`, {
    name: CAMPAIGN_NAME,
    objective: "OUTCOME_LEADS",
    status: "PAUSED",
    special_ad_categories: [],
    spend_cap: SPEND_CAP_PAISE,
    // false keeps each ad set's daily budget a hard ceiling; true lets ad sets
    // lend each other 20% of budget.
    is_adset_budget_sharing_enabled: false,
    // Lowest cost, no bid cap: Meta buys the cheapest leads it can find inside
    // the daily budget. A bid cap would need a number we have no data for yet.
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
  });
  out.campaign_id = campaign.id;
  log("meta_campaign_created", `Campaign ${campaign.id} PAUSED, spend cap Rs ${SPEND_CAP_PAISE / 100}`);
  console.log("campaign", campaign.id);

  // 3. One ad set per creative, each with its own budget. Three ads inside a
  // single ad set is Meta choosing a favourite, not an A/B test: delivery
  // concentrates within hours and the other two starve.
  const end = Math.floor(Date.now() / 1000) + DAYS * 86400;
  const sets = await fetch(
    `${GRAPH}/${campaign.id}/adsets?fields=id,name&limit=100&access_token=${encodeURIComponent(TOKEN)}`
  ).then((r) => r.json());
  const setByName = new Map((sets.data || []).map((a) => [a.name, a.id]));

  out.ads = [];
  for (const [i, ad] of ADS.entries()) {
    const setName = `AS${i + 1} | ${ad.cell} | Owners M35-65 | 11 states`;
    let adsetId = setByName.get(setName);
    if (adsetId) {
      // Reused ad sets keep their budget and schedule. Only extend.mjs moves
      // money or time; a creative refresh must never do it silently.
      console.log("reusing adset", setName, adsetId);
    } else {
      const created = await api(`${ACCOUNT}/adsets`, {
        name: setName,
        campaign_id: campaign.id,
        status: "PAUSED",
        daily_budget: DAILY_BUDGET_PAISE,
        end_time: end,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LEAD_GENERATION",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        destination_type: "ON_AD",
        promoted_object: { page_id: PAGE },
        targeting: TARGETING,
      });
      adsetId = created.id;
      log("meta_adset_created", `${setName} -> ${adsetId} PAUSED, Rs ${DAILY_BUDGET_PAISE / 100}/day`);
      console.log("adset", setName, adsetId);
    }

    const liveAds = await fetch(
      `${GRAPH}/${adsetId}/ads?fields=id,name&limit=50&access_token=${encodeURIComponent(TOKEN)}`
    ).then((r) => r.json());
    const existingAdId = (liveAds.data || []).find((a) => a.name === ad.name)?.id;

    const hash = await uploadImage(ad.image);
    const creative = await api(`${ACCOUNT}/adcreatives`, {
      name: `${ad.name} | creative`,
      object_story_spec: {
        page_id: PAGE,
        instagram_user_id: PBIA,
        link_data: {
          image_hash: hash,
          link: `${SITE}/ai`,
          message: ad.message,
          name: ad.headline,
          description: ad.description,
          call_to_action: { type: "SIGN_UP", value: { lead_gen_form_id: form.id } },
        },
      },
      // Opt out of the enhancements that would rewrite the copy or restyle the
      // image: the whole point of the test is that the ads differ only on the
      // headline we wrote.
      degrees_of_freedom_spec: {
        creative_features_spec: {
          text_optimizations: { enroll_status: "OPT_OUT" },
          image_touchups: { enroll_status: "OPT_OUT" },
          image_brightness_and_contrast: { enroll_status: "OPT_OUT" },
          enhance_cta: { enroll_status: "OPT_OUT" },
          image_templates: { enroll_status: "OPT_OUT" },
          add_text_overlay: { enroll_status: "OPT_OUT" },
        },
      },
    });

    let adId = existingAdId;
    if (adId) {
      await api(adId, { creative: { creative_id: creative.id } });
      log("meta_ad_refreshed", `${ad.name} -> ad ${adId} new creative ${creative.id}`);
      console.log("  refreshed", ad.name, adId);
    } else {
      const created = await api(`${ACCOUNT}/ads`, {
        name: ad.name,
        adset_id: adsetId,
        creative: { creative_id: creative.id },
        status: "PAUSED",
      });
      adId = created.id;
      log("meta_ad_created", `${ad.name} -> ad ${adId} PAUSED in ${setName}`);
      console.log("  ad", ad.name, adId);
    }
    out.ads.push({ cell: ad.cell, adset_id: adsetId, ad_id: adId, creative_id: creative.id });
  }

  out.pixel_id = PIXEL;
  out.review_url = `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${ACCOUNT.replace("act_", "")}&selected_campaign_ids=${campaign.id}`;
  mkdirSync(join(ROOT, "ads", "live"), { recursive: true });
  writeFileSync(join(ROOT, "ads", "live", "meta-phase1.json"), JSON.stringify(out, null, 2) + "\n");
  console.log("\nDone. New objects are created PAUSED; existing ads keep their status (Meta re-reviews a changed creative). Review:", out.review_url);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
