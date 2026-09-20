// Privacy policy content for /privacy. DRAFT written for the paid-acquisition
// launch (Meta requires a policy URL on every Instant Form). A founder and,
// ideally, a lawyer should review it before it is relied on: in particular the
// legal entity name, the retention period and the grievance contact.

export const PRIVACY_UPDATED = "21 September 2026";

export const PRIVACY_CONTACT = "hello@goatedd.tech";

export type PolicySection = {
  heading: string;
  intro?: string;
  items: string[];
};

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: "Who this covers",
    items: [
      "GOATED. is a software and AI automation studio based in Mumbai, India.",
      "This policy covers goatedd.tech, its booking and lead forms, and lead forms run on Meta and X on behalf of GOATED.",
    ],
  },
  {
    heading: "Information collected",
    intro: "From forms you submit:",
    items: [
      "Name, work email, company name, phone number and annual revenue range.",
      "The date, time and notes of any call you book.",
      "Messages you send through the contact form.",
    ],
  },
  {
    heading: "Information collected automatically",
    items: [
      "Pages viewed, device and browser type, approximate location from IP address, and the ad or link that brought you to the site.",
      "Cookies and pixels from Meta, X and PostHog record visits and form submissions for measurement and ad delivery.",
    ],
  },
  {
    heading: "How it is used",
    items: [
      "To reply to your enquiry and run the call you booked.",
      "To prepare a proposal for your business.",
      "To measure which ads and pages lead to enquiries.",
      "To show GOATED. ads to similar businesses.",
    ],
  },
  {
    heading: "Who receives it",
    intro: "Service providers that process data for GOATED.:",
    items: [
      "Meta Platforms and X Corp. for advertising and conversion measurement, with email and phone sent in hashed form.",
      "Cal.com for scheduling.",
      "Supabase for the enquiry database.",
      "PostHog for product analytics.",
      "Vercel for website hosting.",
      "Information is shared outside this list only when the law requires it.",
    ],
  },
  {
    heading: "Where it is stored",
    items: [
      "These providers store data on servers in India, the United States and the European Union.",
    ],
  },
  {
    heading: "How long it is kept",
    items: [
      "Enquiry and lead records are kept for 24 months from your last contact, then deleted.",
      "Records tied to a signed engagement are kept for the period tax and contract law requires.",
    ],
  },
  {
    heading: "Your rights",
    intro: "Under the Digital Personal Data Protection Act, 2023 you can:",
    items: [
      "Ask for a copy of the personal data held about you.",
      "Ask for it to be corrected or deleted.",
      "Withdraw consent to marketing at any time.",
      "Raise a grievance, and escalate it to the Data Protection Board of India.",
      `Email ${PRIVACY_CONTACT} for any of these; requests are answered within 30 days.`,
    ],
  },
  {
    heading: "Cookies",
    items: [
      "Browser settings let you block or delete cookies.",
      "Meta and X each provide ad preference controls in your account settings.",
    ],
  },
  {
    heading: "Changes",
    items: ["Updates to this policy are posted on this page with a new date."],
  },
];
