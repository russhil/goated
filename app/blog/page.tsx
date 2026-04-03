import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blogPosts";
import Navbar from "@/components/Navbar";
import ContactFooter from "@/components/ContactFooter";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "Blog | Software Development & AI Automation Insights",
  description:
    "Insights on custom software development, AI automation, tech stacks, and building better businesses. Written by GOATED., a software agency in Mumbai, India.",
  alternates: {
    canonical: "https://goatedd.tech/blog",
  },
  openGraph: {
    title: "Blog | Software Development & AI Automation Insights | GOATED.",
    description:
      "Insights on custom software development, AI automation, tech stacks, and building better businesses.",
    url: "https://goatedd.tech/blog",
  },
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <main>
      <CustomCursor />
      <Navbar />

      <section className="pt-28 md:pt-36 pb-20 max-w-[900px] mx-auto px-6 md:px-12">
        <div className="section-label">{"// blog"}</div>
        <h1
          className="font-serif text-dark leading-[1.15] mb-4"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          Insights & Guides
        </h1>
        <p className="font-sans text-gray-500 mb-16 max-w-xl">
          Practical thinking on custom software development, AI automation,
          choosing the right tech stack, and building businesses that run
          themselves.
        </p>

        <div className="flex flex-col">
          {sorted.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group border-t border-[#EEEEEE] py-8 block hover:bg-gray-50/50 -mx-4 px-4 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono text-coral uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-xs text-muted">
                  {new Date(post.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted">{post.readTime}</span>
              </div>
              <h2 className="font-serif text-xl md:text-2xl text-dark group-hover:text-coral transition-colors mb-2">
                {post.title}
              </h2>
              <p className="font-sans text-sm text-gray-500 leading-relaxed">
                {post.description}
              </p>
            </Link>
          ))}
          <div className="border-t border-[#EEEEEE]" />
        </div>
      </section>

      <ContactFooter />
    </main>
  );
}
