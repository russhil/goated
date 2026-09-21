// All copy and proof figures for the /ai campaign page live here so a claim
// can be corrected in one place. Proof figures are founder-confirmed; client
// names stay anonymised. Written for an owner reading English as a second
// language: short, complete sentences, numerals, no idioms.

export type HeroVariant = "a" | "b";

export const DEFAULT_VARIANT: HeroVariant = "a";

export function resolveVariant(raw: string | string[] | undefined): HeroVariant {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "b" ? "b" : DEFAULT_VARIANT;
}

export const CTA_LABEL = "Book a free call";

export const HERO = {
  eyebrow: "Free AI consulting · Limited slots",
  headline: "AI can replace up to 30% of your staff.",
  subhead: "Watch this 1-minute video from our founder.",
  facts: ["Free", "30 minutes", "Talk to a founder"],
};

export const FOUNDERS = {
  label: "Who we are",
  heading: "We are the founders of GOATED.",
  lines: [
    "From IIM and BITS Pilani.",
    "We have built AI for businesses across India.",
    "We know how a business runs, and where AI saves money.",
  ],
  people: [
    { name: "Russhil Chawla", role: "Founder & CEO", photo: "/ai-russhil.jpg" },
    { name: "Vansh Sood", role: "Co-founder", photo: "/ai-vansh.jpg" },
  ],
};

// Plain-word jobs, broad on purpose: the owner should see his own office in
// at least one of them.
export const JOBS = {
  label: "What AI can do",
  heading: "Work your staff repeats every day. AI can do it.",
  items: [
    { icon: "keyboard", title: "Data entry", body: "Orders typed into your system" },
    { icon: "rupee", title: "Billing", body: "Invoices and payment follow-ups" },
    { icon: "chart", title: "Reports", body: "Daily numbers, ready every morning" },
    { icon: "chat", title: "Customer replies", body: "Common questions answered in seconds" },
    { icon: "box", title: "Stock", body: "Tracked across every godown" },
    { icon: "check", title: "Checking", body: "Mistakes caught before they cost you" },
  ],
};

export const PROOF = {
  label: "Real result",
  heading: "One client. One team.",
  rows: [
    { label: "Saved every month", value: "₹3.6 lakh" },
    { label: "Saved in one year", value: "₹40 lakh+" },
  ],
};

export const STEPS = {
  label: "How it works",
  items: [
    { n: "1", title: "Free call", body: "30 minutes. Tell us how your business runs." },
    { n: "2", title: "Clear plan", body: "Where AI saves you money, and how much." },
    { n: "3", title: "AI at work", body: "Visible results within 1 month." },
  ],
};

// The second hurdle is sharing details at all; each line answers one worry
// an owner has before he types his phone number.
export const TRUST = {
  label: "Why owners trust us",
  items: [
    { title: "NDA first", body: "Signed before you share any data." },
    { title: "You own it", body: "The software and the data stay in your name." },
    { title: "Founder-led", body: "You speak to a founder, every time." },
  ],
};

export const CLIENTS_LABEL = "Our clients";

export const CLOSE = {
  heading: "Free consulting for a few businesses each month.",
  body: "Book a call. Decide after.",
};
