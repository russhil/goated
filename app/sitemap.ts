import { MetadataRoute } from "next";
import { caseStudies } from "@/lib/caseStudies";
import { blogPosts } from "@/lib/blogPosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const caseStudyUrls = caseStudies.map((cs) => ({
    url: `https://goatedd.tech/portfolio/${cs.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogUrls = blogPosts.map((post) => ({
    url: `https://goatedd.tech/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://goatedd.tech",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://goatedd.tech/portfolio",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "https://goatedd.tech/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...caseStudyUrls,
    ...blogUrls,
  ];
}
