// Currency → INR conversion for the Admin HQ dashboard.
//
// Rates are "how many INR is 1 unit of currency X" (inrPerUnit). We fetch live
// ECB rates via frankfurter.app (no API key), cached ~24h by the Next fetch
// cache, and fall back to hardcoded rates if the fetch fails or a currency is
// unsupported. Note: ECB (and therefore frankfurter) does NOT publish AED, so
// AED always uses the fallback.

export const FALLBACK_INR_PER_UNIT: Record<string, number> = {
  INR: 1,
  USD: 83,
  GBP: 106,
  EUR: 90,
  AED: 22.6,
};

// Currencies frankfurter/ECB can price against INR. AED is intentionally absent.
const LIVE_SYMBOLS = ["USD", "GBP", "EUR"] as const;

export async function getInrRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = { ...FALLBACK_INR_PER_UNIT };
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=INR&to=${LIVE_SYMBOLS.join(",")}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("fx fetch failed");
    const data = (await res.json()) as { rates?: Record<string, number> };
    for (const sym of LIVE_SYMBOLS) {
      const perInr = data.rates?.[sym];
      // data.rates[sym] = units of `sym` per 1 INR → invert for INR per unit.
      if (typeof perInr === "number" && perInr > 0) {
        rates[sym] = 1 / perInr;
      }
    }
  } catch {
    // keep fallback rates
  }
  return rates;
}
