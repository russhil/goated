"use client";

import { useEffect, useState } from "react";

// Live illustrations of the three case studies. Each one loops through a
// fixed script while its panel is on screen; `active` pauses it otherwise.
// The names and quantities inside are illustrative, the savings beside them
// are real.

// Steps through a script while active. `length` 0 means count forever;
// `start` pre-fills the scene so a panel never opens empty.
function useTicker(active: boolean, length: number, ms: number, start = 0) {
  const [step, setStep] = useState(start);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setStep((s) => (length ? (s + 1) % length || start : s + 1)), ms);
    return () => window.clearInterval(id);
  }, [active, length, ms, start]);
  return step;
}

const ORDERS = [
  { from: "Sharma Traders, Pune", text: "200 sheet white gloss 1mm bhej do", item: "White Gloss 1mm", qty: 200 },
  { from: "Om Laminates, Surat", text: "Teak matte 0.8 ke 50 sheet chahiye", item: "Teak Matte 0.8mm", qty: 50 },
  { from: "Kapoor Interiors", text: "Grey suede 1mm 120 sheet urgent chahiye", item: "Grey Suede 1mm", qty: 120 },
  { from: "Jain Plywood, Indore", text: "Walnut 1mm 80 sheet same rate pe", item: "Walnut 1mm", qty: 80 },
  { from: "Mehta Traders, Nagpur", text: "Ivory gloss 1mm 150 sheet kal tak", item: "Ivory Gloss 1mm", qty: 150 },
  { from: "Patel Decor, Rajkot", text: "Oak matte 0.8 ke 60 sheet", item: "Oak Matte 0.8mm", qty: 60 },
];

// A continuous stream: a WhatsApp order arrives on the left, and a beat later
// it lands as an ERP row on the right, with no one typing in between.
export function OrderDeskDemo({ active }: { active: boolean }) {
  const step = useTicker(active, 0, 1100, 5);
  const arrived = Math.ceil(step / 2);
  const entered = Math.floor(step / 2);
  const pick = (n: number) => ({ ...ORDERS[n % ORDERS.length], key: n });
  const messages = Array.from({ length: Math.min(3, arrived) }, (_, i) => pick(arrived - Math.min(3, arrived) + i));
  const rows = Array.from({ length: Math.min(5, entered) }, (_, i) => pick(entered - 1 - i));

  return (
    <div className="grid h-full grid-cols-[1fr_1.05fr] gap-2.5 md:gap-4">
      <div className="flex flex-col overflow-hidden rounded-2xl bg-[#ECE5DD]">
        <p className="bg-[#075E54] px-3 py-2 font-sans text-[12px] font-semibold text-white md:text-sm">
          <span className="hidden md:inline">Dealer orders · </span>WhatsApp
        </p>
        <div className="flex flex-1 flex-col justify-end gap-1.5 overflow-hidden p-2 md:gap-2 md:p-3">
          {messages.map((o) => (
            <div key={o.key} className="ai-pop rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-[0_1px_0_rgba(0,0,0,0.12)]">
              <p className="font-sans text-[10px] font-bold text-[#128C7E] md:text-xs">{o.from}</p>
              <p className="font-sans text-[11px] leading-snug text-dark md:text-sm">{o.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-dark/10">
        <p className="flex items-center justify-between gap-2 bg-dark px-3 py-2 font-sans text-[12px] font-semibold text-white md:text-sm">
          ERP<span className="hidden md:inline"> · Sales orders</span>
          <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] md:text-[11px]">AI</span>
        </p>
        <div className="flex-1 divide-y divide-dark/[0.07] overflow-hidden px-2.5 md:px-3">
          {rows.map((o) => (
            <div key={o.key} className="ai-pop flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate font-sans text-[11px] font-semibold text-dark md:text-sm">{o.item}</p>
                <p className="truncate font-sans text-[10px] text-gray-500 md:text-xs">{o.from.split(",")[0]}</p>
              </div>
              <p className="ai-lining shrink-0 font-sans text-[11px] font-bold text-dark md:text-sm">
                {o.qty} <span className="ml-1 text-[#1a7f4b]">✓</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const PRICES = [
  { item: "Ceiling fan 1200mm", from: "2,150", to: "2,290" },
  { item: "Wire 1.5 sq mm, 90 m", from: "1,840", to: "1,920" },
  { item: "MCB 32A double pole", from: "612", to: "648" },
  { item: "Modular switch 6A", from: "84", to: "91" },
];

// A scanned supplier price list is read line by line and the catalogue
// updates; then a customer's WhatsApp request becomes a ready quote.
export function DistributorDemo({ active }: { active: boolean }) {
  const step = useTicker(active, PRICES.length + 5, 900, 2);
  const read = Math.min(PRICES.length, step);
  const quoteAsked = step >= PRICES.length + 1;
  const quoteReady = step >= PRICES.length + 2;

  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-2.5 md:gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-dark/10">
        <p className="flex items-center justify-between bg-dark px-3 py-2 font-sans text-[12px] font-semibold text-white md:text-sm">
          <span>Supplier price list<span className="hidden md:inline"> · scanned PDF</span></span>
          <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] md:text-[11px]">AI reading</span>
        </p>
        <div className="divide-y divide-dark/[0.07] px-3">
          {PRICES.map((p, i) => (
            <div key={p.item} className={`flex items-center justify-between gap-3 py-2 transition-colors duration-500 ${i < read ? "" : "opacity-40"}`}>
              <p className="truncate font-sans text-[11px] font-semibold text-dark md:text-sm">{p.item}</p>
              <p className="ai-lining shrink-0 font-sans text-[11px] md:text-sm">
                {i < read ? (
                  <>
                    <span className="text-gray-400 line-through">₹{p.from}</span>{" "}
                    <span className="font-bold text-dark">₹{p.to}</span> <span className="text-[#1a7f4b]">✓</span>
                  </>
                ) : (
                  <span className="text-gray-400">₹{p.from}</span>
                )}
              </p>
            </div>
          ))}
        </div>
        {read < PRICES.length && active && <div className="ai-scan pointer-events-none absolute inset-x-0 top-9 h-8" aria-hidden="true" />}
      </div>
      <div className="flex min-h-[4.5rem] items-end gap-2 rounded-2xl bg-[#ECE5DD] p-2 md:min-h-[5.5rem] md:p-3">
        {quoteAsked && (
          <p className="ai-pop rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 font-sans text-[11px] leading-snug text-dark shadow-[0_1px_0_rgba(0,0,0,0.12)] md:text-sm">
            20 fans aur 10 MCB ka quote bhejo
          </p>
        )}
        {quoteReady && (
          <p className="ai-pop ml-auto rounded-lg rounded-tr-none bg-[#DCF8C6] px-2.5 py-1.5 font-sans text-[11px] leading-snug text-dark shadow-[0_1px_0_rgba(0,0,0,0.12)] md:text-sm">
            <span className="font-bold">Quote ready</span> · 30 items · PDF sent
          </p>
        )}
      </div>
    </div>
  );
}

const SOURCES = ["AWAL", "Believe", "TuneCore", "DistroKid", "SoundCloud"];

// Every distributor's report, each in its own format, flows into one engine
// and an artist statement builds itself.
export function RoyaltyDemo({ active }: { active: boolean }) {
  const step = useTicker(active, SOURCES.length + 5, 850, 2);
  const merged = Math.min(SOURCES.length, step);
  const ready = step >= SOURCES.length + 1;

  return (
    <div className="grid h-full grid-cols-[0.8fr_1.2fr] items-stretch gap-2.5 md:gap-4">
      <div className="flex flex-col justify-center gap-1.5 md:gap-2">
        {SOURCES.map((s, i) => (
          <div
            key={s}
            className={`flex items-center justify-between rounded-xl px-2.5 py-2 font-sans text-[11px] font-semibold transition-all duration-500 md:px-3 md:text-sm ${
              i < merged ? "translate-x-1.5 bg-coral/10 text-coral" : "bg-white text-dark ring-1 ring-dark/10"
            }`}
          >
            {s}
            <span aria-hidden="true">{i < merged ? "→" : ".xlsx"}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-dark/10">
        <p className="flex items-center justify-between bg-dark px-3 py-2 font-sans text-[12px] font-semibold text-white md:text-sm">
          Artist statement
          <span className={`rounded-full px-2 py-0.5 text-[10px] md:text-[11px] ${ready ? "bg-[#1a7f4b]" : "bg-coral"}`}>{ready ? "Ready" : "Building"}</span>
        </p>
        <div className="flex-1 divide-y divide-dark/[0.07] px-3">
          {SOURCES.slice(0, merged).map((s) => (
            <div key={s} className="ai-pop flex items-center justify-between py-1.5 md:py-2">
              <p className="font-sans text-[11px] text-gray-600 md:text-sm">{s} streams</p>
              <p className="font-sans text-[11px] font-bold text-[#1a7f4b] md:text-sm">✓</p>
            </div>
          ))}
        </div>
        {ready && <p className="ai-pop border-t border-dark/10 px-3 py-2 font-sans text-[11px] font-bold text-dark md:text-sm">Splits, costs and recoupment applied</p>}
      </div>
    </div>
  );
}
