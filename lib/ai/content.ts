// All copy for the /ai page lives here. The page is one argument, readable
// from the headlines alone in a few seconds: the problem an owner feels,
// what changes with AI, proof, how it happens, who we are, one action.
// No money figures; clients described by sector only.

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
  line: "Most of this is the same task, done again and again.",
};

export const CHANGE = {
  headline: "AI now does that work. Your people handle the rest.",
  proof: {
    before: 15,
    after: 3,
    line: "One manufacturer's order desk. Live in 6 weeks.",
  },
};

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
  headline: "Find out what AI can do in your business.",
  facts: ["Free", "30 minutes", "With a founder"],
};
