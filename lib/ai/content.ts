// All copy for the /ai page lives here. The page is one argument, readable
// from the headlines alone in a few seconds: the problem an owner feels,
// what changes with AI, proof, how it happens, who we are, one action.
// Clients are described by sector unless the founder has named them.

export type HeroVariant = "a" | "b";

export const DEFAULT_VARIANT: HeroVariant = "a";

export function resolveVariant(raw: string | string[] | undefined): HeroVariant {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "b" ? "b" : DEFAULT_VARIANT;
}

export const CTA_LABEL = "Book a free call";

export const HERO = {
  headline: "Grow your business without hiring more people.",
  subhead: "GOATED builds AI that does your team's repeat work.",
  facts: ["Free", "30 minutes", "With a founder"],
};

export const PROBLEM = {
  headline: "Today, more business means more staff.",
  work: ["Data entry", "Follow-ups", "Reports", "Billing", "Customer replies", "Checking"],
  line: "Most of it is the same task, done again and again. AI can now do it.",
};

export const CASES_INTRO = {
  headline: "Three businesses that stopped hiring for it.",
};

export type CaseStudy = {
  client: string;
  system: string;
  story: string;
  saved: string;
  savedUnit: string;
  rows: { label: string; value: string }[];
  flow: { label: string; cut?: boolean }[];
  demo: "orders" | "distributor" | "royalty";
};

// Founder-confirmed results. The live demo beside each is an illustration of
// how the system works; the figures here are real.
export const CASES: CaseStudy[] = [
  {
    client: "Pan-India laminate manufacturer",
    system: "AI order desk",
    story: "Dealers send orders on WhatsApp. AI enters them into the ERP.",
    saved: "₹3.6 lakh",
    savedUnit: "saved every month",
    rows: [
      { label: "Order desk team", value: "15 → 3" },
      { label: "Saved in a year", value: "₹40 lakh+" },
      { label: "Live in", value: "6 weeks" },
    ],
    flow: [{ label: "Dealer" }, { label: "Order typist", cut: true }, { label: "AI" }, { label: "ERP" }],
    demo: "orders",
  },
  {
    client: "Electrical goods distributor",
    system: "Stock and quotes",
    story: "AI reads supplier price lists and makes quotes in one click.",
    saved: "₹2 lakh",
    savedUnit: "saved every month",
    rows: [
      { label: "Staff freed for sales", value: "30%" },
      { label: "Saved in a year", value: "₹24 lakh" },
      { label: "Stock files merged", value: "4 → 1" },
    ],
    flow: [{ label: "Supplier PDF" }, { label: "Manual typing", cut: true }, { label: "AI" }, { label: "Quote" }],
    demo: "distributor",
  },
  {
    client: "Azadi Records",
    system: "Royalty statements",
    story: "Every distributor's report, read and matched into one statement.",
    saved: "3 months",
    savedUnit: "saved on every statement",
    rows: [
      { label: "Distributor formats", value: "10+ → 1" },
      { label: "Revenue lines handled", value: "6.5 million+" },
      { label: "Statement time", value: "Minutes" },
    ],
    flow: [{ label: "10+ reports" }, { label: "Months of Excel", cut: true }, { label: "AI" }, { label: "Statement" }],
    demo: "royalty",
  },
];

export const PATH = {
  headline: "Live in weeks, built around your business.",
  steps: [
    { title: "Free call", body: "Tell us how your business runs." },
    { title: "We study your team", body: "Every repeat task, found and listed." },
    { title: "AI goes live", body: "In 4 to 8 weeks, on your current systems." },
  ],
};

export const TRUST = {
  headline: "Built by founders from IIM and BITS Pilani.",
  people: [
    { name: "Russhil Chawla", role: "Founder & CEO · IIM", photo: "/ai-russhil.jpg" },
    { name: "Vansh Sood", role: "Co-founder · BITS Pilani", photo: "/ai-vansh.jpg" },
  ],
  promises: ["NDA before any data", "You own the software", "Works with your ERP, Excel and WhatsApp"],
  clientsLabel: "Our clients",
};

export const CLOSE = {
  headline: "Find out what AI can save your business.",
  facts: ["Free", "30 minutes", "With a founder"],
};
