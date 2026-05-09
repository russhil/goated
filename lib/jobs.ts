export type JobRole = "devops" | "growth-strategy";

export type JobField = {
  key: "github_url" | "linkedin_url" | "instagram_url" | "pitch";
  label: string;
  placeholder: string;
  type: "url" | "text" | "textarea";
  required: boolean;
};

export type Job = {
  slug: JobRole;
  title: string;
  tagline: string;
  description: string;
  task: {
    heading: string;
    body: string;
  };
  fields: JobField[];
};

export const JOBS: Job[] = [
  {
    slug: "devops",
    title: "DevOps Engineer",
    tagline: "Ship infra that scales without drama.",
    description:
      "We're looking for someone who's obsessed with making things deploy faster, monitor smarter, and never page at 3am. You'll own the pipelines and infra across our client builds and in-house products.",
    task: {
      heading: "Show us your craziest project",
      body: "Send us the most ambitious thing you've shipped. Could be a homegrown Kubernetes cluster, a CI/CD pipeline you obsessed over, a self-hosted observability stack — whatever you're proud of. Drop the GitHub repo and tell us what made it hard.",
    },
    fields: [
      {
        key: "github_url",
        label: "GitHub link",
        placeholder: "https://github.com/yourname/your-craziest-project",
        type: "url",
        required: true,
      },
      {
        key: "linkedin_url",
        label: "LinkedIn",
        placeholder: "https://linkedin.com/in/yourname",
        type: "url",
        required: true,
      },
      {
        key: "pitch",
        label: "What made it hard? (optional)",
        placeholder: "30 seconds of context — the thing you're most proud of fixing.",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    slug: "growth-strategy",
    title: "Growth & Strategy",
    tagline: "Turn audience into pipeline. Pipeline into revenue.",
    description:
      "We're looking for someone with a sharp eye for narrative, distribution, and what makes people actually click. You'll work directly with the founders on positioning, content, and growth experiments across our brand and our clients.",
    task: {
      heading: "Show us how you think",
      body: "Drop your LinkedIn and Instagram so we can see what you've shipped publicly — content, campaigns, brand work, side projects, anything that shows your taste and your reach. If you've got a one-line pitch on what we should be doing differently, even better.",
    },
    fields: [
      {
        key: "linkedin_url",
        label: "LinkedIn",
        placeholder: "https://linkedin.com/in/yourname",
        type: "url",
        required: true,
      },
      {
        key: "instagram_url",
        label: "Instagram",
        placeholder: "https://instagram.com/yourname",
        type: "url",
        required: true,
      },
      {
        key: "pitch",
        label: "One-liner: what should we be doing differently? (optional)",
        placeholder: "Be opinionated.",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export function getJob(slug: string): Job | undefined {
  return JOBS.find((j) => j.slug === slug);
}
