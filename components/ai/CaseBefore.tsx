import Image from "next/image";
import type { ReactNode } from "react";

// The "before" of each case, built from the client's real material: verbatim
// WhatsApp order messages (sender names removed), the real scanned supplier
// price list (cropped to its tables), and real spreadsheet rows including
// their broken cells. Nothing here identifies the client.

function Sheet({
  file,
  cols,
  rows,
  tabs,
  warning,
}: {
  file: string;
  cols: string[];
  rows: (string | number)[][];
  tabs: string[];
  warning: string;
}) {
  const letters = "ABCDEFGH";
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-white font-sans text-dark ring-1 ring-black/15">
      <p className="flex items-center gap-2 bg-[#107C41] px-3 py-1.5 text-[11px] font-semibold text-white md:text-xs">
        <span className="flex gap-1" aria-hidden="true">
          <i className="h-2 w-2 rounded-full bg-white/40" />
          <i className="h-2 w-2 rounded-full bg-white/40" />
          <i className="h-2 w-2 rounded-full bg-white/40" />
        </span>
        <span className="truncate">{file}</span>
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">
        <table className="w-full table-fixed border-collapse text-[10px] md:text-xs">
          <thead>
            <tr className="bg-[#f3f3f3] text-gray-500">
              <th className="w-6 border border-[#dadada] font-normal" />
              {cols.map((_, i) => (
                <th key={i} className="border border-[#dadada] py-0.5 font-normal">
                  {letters[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[#fff2cc] font-bold">
              <td className="border border-[#dadada] text-center text-gray-400">1</td>
              {cols.map((c) => (
                <td key={c} className="truncate border border-[#dadada] px-1 py-1">
                  {c}
                </td>
              ))}
            </tr>
            {rows.map((r, ri) => (
              <tr key={ri}>
                <td className="border border-[#dadada] text-center text-gray-400">{ri + 2}</td>
                {r.map((v, ci) => (
                  <td key={ci} className={`truncate border border-[#dadada] px-1 py-1 ${typeof v === "number" ? "text-right" : ""}`}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-px overflow-hidden bg-[#e6e6e6] text-[10px] md:text-[11px]">
        {tabs.map((t, i) => (
          <span key={t} className={`shrink-0 px-2 py-1 ${i === 0 ? "bg-white font-semibold text-[#107C41]" : "text-gray-600"}`}>
            {t}
          </span>
        ))}
      </div>
      <p className="bg-[#FFF4CE] px-3 py-1 text-[10px] text-[#8a6100] md:text-[11px]">⚠ {warning}</p>
    </div>
  );
}

// Real messages from a dealer WhatsApp group, verbatim.
const DEALER_MESSAGES = [
  "Sf 9043 - 10 ?",
  "zm 156  - 50 available?",
  "Sf 129 - 20\nSf 135 - 10\nOrder conform",
  "Make it 10 order conform",
  "Bill and lr send",
  "Date not visible\nAnd send me srd lr copy for this",
];

function Stack({ children }: { children: ReactNode }) {
  return <div className="grid h-full grid-cols-[1fr_1.05fr] gap-2.5 md:gap-4">{children}</div>;
}

export function OrderDeskBefore() {
  return (
    <Stack>
      <div className="flex flex-col overflow-hidden rounded-2xl bg-[#ECE5DD]">
        <p className="bg-[#075E54] px-3 py-2 font-sans text-[12px] font-semibold text-white md:text-sm">Dealer group · 214 unread</p>
        <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden p-2 md:p-3">
          {DEALER_MESSAGES.map((m) => (
            <p key={m} className="whitespace-pre-line rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 font-sans text-[11px] leading-snug text-dark shadow-[0_1px_0_rgba(0,0,0,0.12)] md:text-sm">
              {m}
            </p>
          ))}
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-md border-2 border-[#808080] bg-[#c0c0c0] font-mono text-[10px] text-black md:text-xs">
        <p className="bg-[#000080] px-2 py-1 font-bold text-white">SALES ORDER ENTRY</p>
        <div className="space-y-1.5 p-2 md:space-y-2 md:p-3">
          {[
            ["Party", "SHARMA PLY & LAM"],
            ["Item code", "SF 129"],
            ["Qty", "20"],
            ["Depot", "?"],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[4.5rem_1fr] items-center gap-1.5 md:grid-cols-[5.5rem_1fr]">
              <span>{k}</span>
              <span className="border-2 border-b-white border-l-[#808080] border-r-white border-t-[#808080] bg-white px-1 py-0.5">
                {v}
                {k === "Depot" && <span className="ai-caret">|</span>}
              </span>
            </div>
          ))}
          <p className="pt-1 text-[#800000]">CREDIT BLOCK: party over limit</p>
          <p className="text-gray-700">F2 Save · F9 Next · Esc Exit</p>
        </div>
      </div>
    </Stack>
  );
}

export function DistributorBefore() {
  return (
    <div className="grid h-full grid-rows-[1.15fr_1fr] gap-2.5 md:gap-3">
      <div className="relative overflow-hidden rounded-xl bg-white ring-1 ring-black/15">
        <Image src="/ai-cases/pricelist.jpg" alt="Scanned supplier price list" fill sizes="(min-width: 768px) 560px, 90vw" className="rotate-[-0.6deg] scale-[1.03] object-cover object-left-top opacity-90 contrast-[0.92] saturate-[0.85]" />
        <p className="absolute bottom-2 left-2 rounded bg-dark/80 px-2 py-0.5 font-sans text-[10px] font-semibold text-white md:text-xs">Scanned PDF · 0 selectable text</p>
      </div>
      <Sheet
        file="STOCK MANAGEMENT SYSTEM - JUNE 2026.xlsx"
        cols={["Product", "Qty", "PRICE", "TOTAL"]}
        rows={[
          ['48"  Ceiling Fan Zoomer  (BROWN)', 232, 1268.43, 294275.76],
          ['48"C FAN SILECCIO MINI DLX  BLDC', 4, 1334.45, 5337.800000000001],
          ['36"  Ceiling Fan Zoomer  (BROWN )', 60, 1268.43, 76105.8],
        ]}
        tabs={["🏠 DASHBOARD", "📋 FAN LOG", "📋 WIRE LOG", "📦 MCB STOCK", "Sheet2"]}
        warning="4 workbooks, 25 sheets, typed by hand"
      />
    </div>
  );
}

export function RoyaltyBefore() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-2.5 md:gap-3">
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4 md:gap-2">
        {[
          ["Awal- January 2026- ROyalty Statements.xlsx", "999 rows"],
          ["tunecore-musicsales-sales_period-11-2025.csv", "11,365 rows"],
          ["distrokid_results_2026-06.csv", "252 rows"],
          ["2103921_1054365_2026-04-01.csv", "15,636 rows"],
        ].map(([f, r]) => (
          <div key={f} className="min-w-0 rounded-lg bg-white px-2 py-1.5 font-sans ring-1 ring-black/15">
            <p className="truncate text-[10px] font-semibold text-dark md:text-xs">{f}</p>
            <p className="text-[10px] text-gray-500 md:text-[11px]">{r}</p>
          </div>
        ))}
      </div>
      <Sheet
        file="2103921_1054365_2026-04-01_2026-06-01.csv"
        cols={["Sales Month", "Platform", "Country", "UPC", "Net EUR"]}
        rows={[
          [46025.00011574074, "YouTube Shorts", "India", "3.61766E+12", 0.009053],
          [46028.00011574074, "YouTube UGC", "Luxembourg", "3.61766E+12", 0.041638],
          [46027.00011574074, "YouTube UGC", "Portugal", "3.61766E+12", 0.006538],
          [46026.00011574074, "YouTube UGC", "Canada", "3.61766E+12", 10.545537],
        ]}
        tabs={["2103921_1054365_2026-04…"]}
        warning="UPC column in scientific notation: 15,636 of 15,636 rows"
      />
    </div>
  );
}
