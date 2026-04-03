import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { blogPosts } from "@/lib/blogPosts";
import Navbar from "@/components/Navbar";
import ContactFooter from "@/components/ContactFooter";
import CustomCursor from "@/components/CustomCursor";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://goatedd.tech/blog/${post.slug}`,
    },
    openGraph: {
      title: `${post.title} | GOATED.`,
      description: post.description,
      url: `https://goatedd.tech/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: ["GOATED."],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function renderMarkdown(content: string) {
  const lines = content.split("\n");
  const elements: { type: string; content: string }[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      elements.push({ type: "p", content: currentParagraph.join("\n") });
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushParagraph();
      elements.push({ type: "h2", content: line.slice(3) });
    } else if (line.startsWith("### ")) {
      flushParagraph();
      elements.push({ type: "h3", content: line.slice(4) });
    } else if (line.startsWith("- **")) {
      flushParagraph();
      elements.push({ type: "li-bold", content: line.slice(2) });
    } else if (line.startsWith("- ")) {
      flushParagraph();
      elements.push({ type: "li", content: line.slice(2) });
    } else if (line.trim() === "") {
      flushParagraph();
    } else {
      currentParagraph.push(line);
    }
  }
  flushParagraph();

  return elements;
}

function InlineFormat({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-dark">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  const elements = renderMarkdown(post.content);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "GOATED.",
      url: "https://goatedd.tech",
    },
    publisher: {
      "@type": "Organization",
      name: "GOATED.",
      url: "https://goatedd.tech",
    },
    mainEntityOfPage: `https://goatedd.tech/blog/${post.slug}`,
    keywords: post.tags.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://goatedd.tech" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://goatedd.tech/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://goatedd.tech/blog/${post.slug}` },
    ],
  };

  const currentIndex = blogPosts.findIndex((p) => p.slug === post.slug);
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const sortedIndex = sortedPosts.findIndex((p) => p.slug === post.slug);
  const prevPost = sortedIndex < sortedPosts.length - 1 ? sortedPosts[sortedIndex + 1] : null;
  const nextPost = sortedIndex > 0 ? sortedPosts[sortedIndex - 1] : null;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleJsonLd, breadcrumbJsonLd]),
        }}
      />
      <CustomCursor />
      <Navbar />

      <article className="pt-28 md:pt-36 pb-20 max-w-[740px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-mono text-xs text-muted">
            <li>
              <Link href="/" className="hover:text-dark transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-dark transition-colors">Blog</Link>
            </li>
            <li>/</li>
            <li className="text-dark truncate max-w-[200px]">{post.title}</li>
          </ol>
        </nav>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
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

        {/* Title */}
        <h1
          className="font-serif text-dark leading-[1.15] mb-6"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          {post.title}
        </h1>

        <p className="text-lg text-gray-500 mb-10 leading-relaxed font-sans">
          {post.description}
        </p>

        <div className="border-t border-[#EEEEEE] mb-10" />

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-10">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono bg-gray-100 text-gray-600 rounded-full px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="prose-goated">
          {elements.map((el, i) => {
            switch (el.type) {
              case "h2":
                return (
                  <h2
                    key={i}
                    className="font-serif text-2xl text-dark mt-12 mb-4"
                  >
                    {el.content}
                  </h2>
                );
              case "h3":
                return (
                  <h3
                    key={i}
                    className="font-sans text-lg font-semibold text-dark mt-8 mb-3"
                  >
                    {el.content}
                  </h3>
                );
              case "li":
                return (
                  <li
                    key={i}
                    className="font-sans text-base text-gray-600 leading-relaxed ml-5 mb-2 list-disc"
                  >
                    <InlineFormat text={el.content} />
                  </li>
                );
              case "li-bold":
                return (
                  <li
                    key={i}
                    className="font-sans text-base text-gray-600 leading-relaxed ml-5 mb-2 list-disc"
                  >
                    <InlineFormat text={el.content} />
                  </li>
                );
              default:
                return (
                  <p
                    key={i}
                    className="font-sans text-base text-gray-600 leading-relaxed mb-4"
                  >
                    <InlineFormat text={el.content} />
                  </p>
                );
            }
          })}
        </div>

        {/* Author */}
        <div className="border-t border-[#EEEEEE] mt-16 pt-8 mb-8">
          <p className="font-mono text-xs text-muted mb-1">Written by</p>
          <p className="font-sans font-semibold text-dark">GOATED.</p>
          <p className="font-sans text-sm text-muted">
            Custom Software & AI Automation Agency, Mumbai
          </p>
        </div>

        {/* Nav */}
        <div className="border-t border-[#EEEEEE] pt-8 flex justify-between items-start gap-4">
          <div className="flex-1">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group block"
              >
                <span className="text-xs font-mono text-muted">← Previous</span>
                <p className="text-sm font-sans text-dark group-hover:text-coral transition-colors mt-1 line-clamp-2">
                  {prevPost.title}
                </p>
              </Link>
            )}
          </div>
          <Link
            href="/blog"
            className="text-xs font-mono text-coral hover:underline flex-shrink-0 mt-1"
          >
            All posts
          </Link>
          <div className="flex-1 text-right">
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group block"
              >
                <span className="text-xs font-mono text-muted">Next →</span>
                <p className="text-sm font-sans text-dark group-hover:text-coral transition-colors mt-1 line-clamp-2">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>
        </div>
      </article>

      <ContactFooter />
    </main>
  );
}
