import { MetadataRoute } from "next";
import { caseStudies } from "@/lib/caseStudies";

export default function sitemap(): MetadataRoute.Sitemap {
  const caseStudyUrls = caseStudies.map((cs) => ({
    url: `https://goated.dev/portfolio/${cs.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: "https://goated.dev",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://goated.dev/portfolio",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...caseStudyUrls,
  ];
}
