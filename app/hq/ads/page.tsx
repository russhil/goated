import { fetchAdInsights } from "@/lib/ads/insights";
import { evaluate, type AdStats, type Signal } from "@/lib/ads/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "../guard";

export const dynamic = "force-dynamic";

const inr = (n: number | null) =>
  n === null ? "–" : `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const num = (n: number) => n.toLocaleString("en-IN");
const pct = (n: number) => `${n.toFixed(2)}%`;

const SIGNAL_STYLE: Record<Signal, string> = {
  healthy: "bg-green-100 text-green-800",
  dead: "bg-red-100 text-red-700",
  learning: "bg-dark/5 text-dark/60",
};

type LeadCounts = {
  website: number;
  instantForm: number;
  companyEmail: number;
  targetRevenue: number;
  bookings: number;
};

async function getLeadCounts(): Promise<LeadCounts | null> {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [leads, bookings] = await Promise.all([
      admin.from("ad_leads").select("source, company_email, target_revenue").gte("created_at", since),
      admin.from("ad_bookings").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if (leads.error) return null;
    const rows = leads.data ?? [];
    return {
      website: rows.filter((r) => r.source === "website").length,
      instantForm: rows.filter((r) => r.source === "instant_form").length,
      companyEmail: rows.filter((r) => r.company_email).length,
      targetRevenue: rows.filter((r) => r.target_revenue).length,
      bookings: bookings.count ?? 0,
    };
  } catch {
    return null;
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-dark/10 pt-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl text-dark">{value}</p>
    </div>
  );
}

function SignalBadge({ label, signal }: { label: string; signal: Signal }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ${SIGNAL_STYLE[signal]}`}>
      {label} {signal}
    </span>
  );
}

export default async function AdsPage() {
  const gate = await requireUser();
  if (!gate.ok || !gate.isOwner) return null;

  const [insights, leadCounts] = await Promise.all([fetchAdInsights(), getLeadCounts()]);
  const ads: AdStats[] = insights.ok ? insights.ads : [];

  const total = ads.reduce(
    (t, a) => ({
      spend: t.spend + a.spend,
      impressions: t.impressions + a.impressions,
      linkClicks: t.linkClicks + a.linkClicks,
      landingPageViews: t.landingPageViews + a.landingPageViews,
      leads: t.leads + a.leads,
    }),
    { spend: 0, impressions: 0, linkClicks: 0, landingPageViews: 0, leads: 0 }
  );
  const bookings = leadCounts?.bookings ?? 0;

  return (
    <section className="mx-auto max-w-[1200px] px-6 pb-24 pt-6 md:px-12">
      <p className="font-mono text-xs uppercase tracking-widest text-coral">{"// ads · last 30 days"}</p>
      <h1 className="mt-3 font-serif text-dark" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
        Paid acquisition
      </h1>
      <p className="mt-2 font-sans text-sm text-muted">This budget buys learning, not a guaranteed client.</p>

      {!insights.ok && (
        <p className="mt-8 rounded-xl border border-dark/10 px-5 py-4 font-sans text-sm text-dark/70">
          {insights.reason === "not_configured"
            ? "Meta reporting: set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID."
            : `Meta reporting error: ${insights.detail ?? "unknown"}`}
        </p>
      )}

      <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        <Stat label="Spend" value={inr(total.spend)} />
        <Stat label="Impressions" value={num(total.impressions)} />
        <Stat label="Link clicks" value={num(total.linkClicks)} />
        <Stat label="CTR" value={pct(total.impressions ? (total.linkClicks / total.impressions) * 100 : 0)} />
        <Stat label="Cost per click" value={inr(total.linkClicks ? total.spend / total.linkClicks : null)} />
        <Stat label="Leads (Meta)" value={num(total.leads)} />
        <Stat label="Cost per lead" value={inr(total.leads ? total.spend / total.leads : null)} />
        <Stat label="Page view to lead" value={pct(total.landingPageViews ? ((leadCounts?.website ?? 0) / total.landingPageViews) * 100 : 0)} />
        <Stat label="Calls booked" value={num(bookings)} />
        <Stat label="Cost per booking" value={inr(bookings ? total.spend / bookings : null)} />
        <Stat label="Company-email leads" value={leadCounts ? num(leadCounts.companyEmail) : "–"} />
        <Stat label="₹25 Cr+ leads" value={leadCounts ? num(leadCounts.targetRevenue) : "–"} />
      </div>

      <h2 className="mt-14 font-serif text-2xl text-dark">By ad</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left font-sans text-sm">
          <thead>
            <tr className="border-b border-dark/15 font-mono text-[10px] uppercase tracking-widest text-muted">
              <th className="py-3 pr-4 font-normal">Ad</th>
              <th className="py-3 pr-4 font-normal">Spend</th>
              <th className="py-3 pr-4 font-normal">Impr.</th>
              <th className="py-3 pr-4 font-normal">Clicks</th>
              <th className="py-3 pr-4 font-normal">CTR</th>
              <th className="py-3 pr-4 font-normal">CPC</th>
              <th className="py-3 pr-4 font-normal">Leads</th>
              <th className="py-3 pr-4 font-normal">CPL</th>
              <th className="py-3 pr-4 font-normal">Signals</th>
              <th className="py-3 font-normal">Rule</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-muted">
                  No ad delivery in the last 30 days.
                </td>
              </tr>
            )}
            {ads.map((ad) => {
              const v = evaluate(ad);
              return (
                <tr key={ad.id} className="border-b border-dark/10 align-top">
                  <td className="py-3 pr-4">
                    <span className="text-dark">{ad.name}</span>
                    <span className="block text-xs text-muted">{ad.adsetName}</span>
                  </td>
                  <td className="py-3 pr-4">{inr(ad.spend)}</td>
                  <td className="py-3 pr-4">{num(ad.impressions)}</td>
                  <td className="py-3 pr-4">{num(ad.linkClicks)}</td>
                  <td className="py-3 pr-4">{pct(v.ctrPct)}</td>
                  <td className="py-3 pr-4">{inr(v.cpc)}</td>
                  <td className="py-3 pr-4">{num(ad.leads)}</td>
                  <td className="py-3 pr-4">{inr(v.costPerLead)}</td>
                  <td className="space-y-1 py-3 pr-4">
                    <SignalBadge label="A" signal={v.signalA} />{" "}
                    <SignalBadge label="B" signal={v.signalB} />
                  </td>
                  <td className="py-3 text-dark/80">{v.action}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
