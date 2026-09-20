// All copy and proof figures for the /ai campaign page live here so a claim
// can be corrected in one place. Proof figures are founder-confirmed; client
// names stay anonymised.

export type HeroVariant = "a" | "b";

export const DEFAULT_VARIANT: HeroVariant = "a";

export function resolveVariant(raw: string | string[] | undefined): HeroVariant {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "b" ? "b" : DEFAULT_VARIANT;
}

export const EYEBROW = "For Indian businesses above ₹25 Cr in revenue";

export const CTA_LABEL = "Book a free 30-minute call";

export const HERO = {
  before: "15",
  after: "3",
  unit: "people on order entry",
  span: "Six weeks",
  subhead:
    "Work that is only people moving data between WhatsApp, Excel and an ERP runs on software.",
  headline: {
    // a: the number leads. b: the pain leads, the number supports.
    a: "An order-entry team of 15 became 3 in six weeks.",
    b: "Orders arrive on WhatsApp. People retype them into the ERP. Software does that job now.",
  } satisfies Record<HeroVariant, string>,
};

export const PAINS = [
  {
    title: "Large teams on data entry",
    body: "Orders, payments and queries retyped into the ERP by hand.",
  },
  {
    title: "Data trapped across sources",
    body: "Reports compiled by hand from five systems, a week late.",
  },
  {
    title: "Processes on WhatsApp and Excel",
    body: "The business runs on who remembers what.",
  },
];

export const PROOF_HEADING = "Not pilots. Production systems.";

export const CASES = [
  {
    sector: "Pan-India laminate manufacturer",
    context:
      "Dealer orders arrived on WhatsApp and a 15-person desk typed each one into the ERP.",
    before: "15",
    after: "3",
    unit: "order-entry staff",
    outcome: "WhatsApp order desk wired into the ERP. Live in six weeks.",
  },
  {
    sector: "One of India's largest music labels",
    context:
      "Royalty data sat in 200,000+ distributor spreadsheets, reconciled by hand per artist.",
    before: "3 months",
    after: "seconds",
    unit: "per-artist royalty reconciliation",
    outcome: "The owner pulls live figures for investor decks himself.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Call",
    meta: "30 minutes",
    body: "A walkthrough of your operations and an estimate of what is automatable.",
  },
  {
    n: "02",
    title: "Audit",
    meta: "Up to 8 departments",
    body: "Staff interviews, then a ranked list of systems by hours freed per month.",
  },
  {
    n: "03",
    title: "Build",
    meta: "Prototype in 2 weeks",
    body: "Fixed price. Production in 4 to 8 weeks, wired into the ERP you already run.",
  },
];

export const AUDIT_OFFER = {
  heading: "Hire GOATED. and the audit was free.",
  rows: [
    { label: "Audit fee", value: "₹1,00,000" },
    { label: "Departments covered", value: "Up to 8" },
    { label: "Credit against any build", value: "₹1,00,000" },
    { label: "Net audit cost with a build", value: "₹0" },
  ],
};

export const REASSURANCE = [
  { title: "Built around your ERP", body: "Vendor ERPs, custom ERPs and plain spreadsheets." },
  { title: "You own everything", body: "Code, data and infrastructure stay in your name." },
  { title: "Fixed price", body: "Quoted in full before work starts." },
];

export const FAQS = [
  {
    question: "How fast is the first result?",
    answer: "A working prototype in 2 weeks. Production in 4 to 8 weeks.",
  },
  {
    question: "Will it work with our ERP?",
    answer:
      "Yes. Live builds run on vendor ERPs, custom ERPs and spreadsheets, through APIs or direct database reads.",
  },
  {
    question: "What does a build cost?",
    answer: "Most builds land between ₹3 lakh and ₹5 lakh. Fixed price, quoted after the call.",
  },
  {
    question: "What happens to the team?",
    answer:
      "The retyping goes away. Owners move those people to sales, collections and customer work.",
  },
  {
    question: "Is our data safe?",
    answer: "An NDA is signed before any data is shared. You own the code and the data.",
  },
];

export const CLOSE = {
  heading: "Thirty minutes. An honest number.",
  body: "Questions about your operations, then an estimate of what is automatable and what it is worth.",
};
