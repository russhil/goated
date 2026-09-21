// All copy and proof figures for the /ai page live here so a claim can be
// corrected in one place. The page reads as a deck of the whole offering, one
// section per slide, for an owner who reads English as a second language:
// short complete sentences, numerals, no idioms.
//
// Rules for this file: no money figures anywhere; client names and anything
// that identifies a client stay off (sector descriptions only). Every figure
// is a measured one from a real engagement (source: goated-sales-demo
// research/dossier.md, founder-confirmed).

export type HeroVariant = "a" | "b";

export const DEFAULT_VARIANT: HeroVariant = "a";

export function resolveVariant(raw: string | string[] | undefined): HeroVariant {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "b" ? "b" : DEFAULT_VARIANT;
}

export const CTA_LABEL = "Book a free call";

export const HERO = {
  eyebrow: "AI systems for Indian businesses",
  headline: "Run a bigger business with a smaller team.",
  subhead:
    "GOATED finds the work your staff repeats every day, and builds AI software that does it.",
  facts: ["Free call", "30 minutes", "With a founder"],
};

// Slide 1: one real order, step by step, as it ran at a client before GOATED.
export const BEFORE = {
  n: "01",
  label: "The problem",
  heading: "Look at how one order moves in most companies.",
  steps: [
    { title: "Salesman writes the order on paper", who: "Salesman" },
    { title: "Sends a photo on WhatsApp", who: "Salesman" },
    { title: "Office checks stock in the ERP", who: "Office staff" },
    { title: "Calls the godown to confirm", who: "Office + godown" },
    { title: "Types the order into the ERP", who: "Data entry staff" },
  ],
  close: "Every step is a person. At 1,000 orders a day, that is a full floor of staff.",
};

// Slide 2: what a GOATED audit actually measured inside one manufacturer.
export const MEASURED = {
  n: "02",
  label: "What we measured",
  heading: "Inside one manufacturer, before GOATED.",
  source: "From our audit of a pan-India laminate manufacturer",
  stats: [
    { value: "300 hrs", unit: "a month", body: "Answering stock and price questions on WhatsApp" },
    { value: "225", unit: "a day", body: "Blocked orders cleared by hand, from memory" },
    { value: "70", unit: "twice a week", body: "Payments typed into the ERP one at a time" },
    { value: "1", unit: "full-time person", body: "Only copying visiting cards from WhatsApp" },
  ],
  quote: "There is no bulk upload. We have to do single, manual entries one by one.",
  quoteBy: "Finance team member",
};

// Slide 3: the same order, after.
export const AFTER = {
  n: "03",
  label: "The GOATED way",
  heading: "The same order, with AI.",
  steps: [
    { title: "Salesman sends a photo", who: "Salesman" },
    { title: "AI reads it, checks stock, enters the order", who: "AI" },
    { title: "One person checks the unusual orders", who: "1 person" },
  ],
  close: "People only handle what needs a human decision.",
};

// Slide 4: the method.
export const METHOD = {
  n: "04",
  label: "How we work",
  heading: "We study your business first. Then we build.",
  steps: [
    { when: "Day 1", title: "Free call", body: "30 minutes with a founder. You explain how the business runs." },
    { when: "Week 1", title: "Audit", body: "Our AI interview tool talks to your staff in Hindi or English. It records every task and the hours it takes." },
    { when: "Week 1", title: "The list", body: "Every repeat task, ranked by staff hours it frees. You pick what to build first." },
    { when: "Week 2", title: "First version", body: "Working software on your real data. You test it, not slides." },
    { when: "Week 4 to 8", title: "Live", body: "Running inside your current systems. Your team trained." },
  ],
};

// Slide 5: every capability here has shipped for a real client.
export const BUILDS = {
  n: "05",
  label: "What we build",
  heading: "One system in place of paper, Excel and WhatsApp.",
  items: [
    { icon: "inbox", title: "Order desks", body: "Orders from WhatsApp, photos and calls, read by AI and entered for you" },
    { icon: "factory", title: "Factory systems", body: "Job cards, fabric and raw material, production to dispatch" },
    { icon: "map", title: "Field sales apps", body: "Beats, visits, orders and collections from the salesman's phone" },
    { icon: "phone", title: "Dealer portals", body: "Dealers place and track orders themselves" },
    { icon: "scale", title: "Accounts and reconciliation", body: "Payments, ledgers and statements matched automatically" },
    { icon: "doc", title: "Documents in your format", body: "Invoices, reports and letters in your exact templates" },
    { icon: "mic", title: "Voice and photo to data", body: "A phone call or a photo of an order book becomes an entry" },
    { icon: "chart", title: "Owner dashboards", body: "The whole business on one screen, every morning" },
    { icon: "chat", title: "Ask your business", body: "Type a question in Hindi or English. Get the answer from live data." },
  ],
};

// Slide 6: results by client type. Sector descriptions only.
export const RESULTS = {
  n: "06",
  label: "Results",
  heading: "Built, live and in daily use.",
  cta: "See what AI can take over in your business.",
  featured: {
    sector: "Pan-India manufacturer · Order desk",
    teamBefore: 15,
    teamAfter: 3,
    caption: "People typing orders into the ERP",
    rows: [
      { label: "Order desk team", value: "15 → 3" },
      { label: "Time to go live", value: "6 weeks" },
    ],
  },
  cases: [
    { sector: "Large sportswear manufacturer", before: "15 Notion databases and a 234-sheet Excel file", after: "One factory system, from job card to dispatch" },
    { sector: "Music labels", before: "10+ distributor formats, royalties done by hand", after: "Artist statements in minutes, not days" },
    { sector: "Electrical goods distributor", before: "4 stock workbooks and scanned price lists", after: "AI reads the price lists. Quotes in one click." },
    { sector: "Fleet operator", before: "Month-end close took one person days", after: "Month-end close in minutes, every figure exact" },
    { sector: "Multi-clinic wellness chain", before: "Paper forms, Word invoices, Excel reports", after: "QR check-in. Invoices and reports in their own format." },
    { sector: "Retail voice AI company", before: "Phone orders, nothing written down", after: "Every call becomes a typed order, in 4 languages" },
  ],
};

// Slide 7: the headcount question, answered head-on.
export const PEOPLE = {
  n: "07",
  label: "Your team",
  heading: "Fewer people on repeat work. You decide the pace.",
  items: [
    { title: "Stop hiring for repeat work", body: "Grow sales without growing the back office." },
    { title: "Move people to growth work", body: "Sales, collections and customer care." },
    { title: "Reduce the team when you choose", body: "We plan the change with you, step by step." },
  ],
};

// Slide 8: after go-live. The sample conversation is labelled as an example.
export const AFTERCARE = {
  n: "08",
  label: "After go-live",
  heading: "Your business, on your phone.",
  body: "Ask a question on WhatsApp. Get the answer from live data. Need a change? Tell the AI, and it reaches our team.",
  chat: [
    { from: "owner", text: "Kal kitne orders aaye? Kitne dispatch baaki hain?" },
    { from: "ai", text: "Yesterday: 212 orders. 38 pending dispatch, 6 of them older than 2 days." },
  ],
  chatLabel: "Example conversation",
  points: [
    { title: "Nightly backups", body: "Every day, automatically." },
    { title: "Change log", body: "Every edit recorded, with who made it." },
    { title: "We keep it running", body: "Fixes and improvements after launch." },
  ],
};

export const FOUNDERS = {
  n: "09",
  label: "Who we are",
  heading: "Founders from IIM and BITS Pilani.",
  body: "We have built AI systems for businesses across India. We understand how a business runs, and where AI saves time. Every client works with us directly.",
  people: [
    { name: "Russhil Chawla", role: "Founder & CEO", detail: "IIM · Strategy", photo: "/ai-russhil.jpg" },
    { name: "Vansh Sood", role: "Co-founder", detail: "BITS Pilani · Engineering", photo: "/ai-vansh.jpg" },
  ],
  promises: [
    { title: "NDA first", body: "Signed before you share any data." },
    { title: "You own everything", body: "Code, data and servers in your name." },
    { title: "Works with your systems", body: "Your ERP, Excel and WhatsApp." },
    { title: "Founder on every call", body: "No sales team in between." },
  ],
};

export const CLIENTS_LABEL = "Our clients";

export const FAQS = [
  {
    question: "Will it work with our ERP?",
    answer: "Yes. We have built on vendor ERPs, custom ERPs and plain Excel. Where an ERP has no API, we work around it.",
  },
  {
    question: "Does my team need to learn something new?",
    answer: "Very little. The AI works inside the tools they already use. We train them before go-live.",
  },
  {
    question: "Is our data safe?",
    answer: "An NDA is signed before any data is shared. The code, data and servers stay in your name.",
  },
  {
    question: "How soon will we see results?",
    answer: "A working first version in 2 weeks. Live in 4 to 8 weeks.",
  },
  {
    question: "What happens on the free call?",
    answer: "A founder asks how your business runs, and tells you honestly where AI can help.",
  },
];

export const CLOSE = {
  heading: "Talk to a founder. Free, 30 minutes.",
  body: "Free consulting for a few businesses each month.",
};
