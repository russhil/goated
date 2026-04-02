import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/lib/caseStudies";
import Navbar from "@/components/Navbar";
import ContactFooter from "@/components/ContactFooter";
import CustomCursor from "@/components/CustomCursor";

export function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cs = caseStudies.find((c) => c.id === params.slug);
  if (!cs) return {};

  return {
    title: `${cs.title} | ${cs.subtitle} | GOATED. Case Study`,
    description: `${cs.description} Built by GOATED., a custom software development and AI automation agency in Mumbai.`,
    alternates: {
      canonical: `https://goated.dev/portfolio/${cs.id}`,
    },
    openGraph: {
      title: `${cs.title} | ${cs.subtitle} | GOATED.`,
      description: cs.description,
      url: `https://goated.dev/portfolio/${cs.id}`,
    },
  };
}

export default function CaseStudyPage({
  params,
}: {
  params: { slug: string };
}) {
  const cs = caseStudies.find((c) => c.id === params.slug);
  if (!cs) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://goated.dev",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Portfolio",
        item: "https://goated.dev/portfolio",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cs.title,
        item: `https://goated.dev/portfolio/${cs.id}`,
      },
    ],
  };

  const caseStudyJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: cs.title,
    description: cs.description,
    creator: {
      "@type": "Organization",
      name: "GOATED.",
      url: "https://goated.dev",
    },
    dateCreated: cs.year,
    ...(cs.link ? { url: cs.link } : {}),
    about: cs.tags.map((tag) => ({ "@type": "Thing", name: tag })),
  };

  const currentIndex = caseStudies.findIndex((c) => c.id === cs.id);
  const nextCs = caseStudies[(currentIndex + 1) % caseStudies.length];
  const prevCs =
    caseStudies[(currentIndex - 1 + caseStudies.length) % caseStudies.length];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([breadcrumbJsonLd, caseStudyJsonLd]),
        }}
      />
      <CustomCursor />
      <Navbar />

      <article className="pt-28 md:pt-36 pb-20 max-w-[900px] mx-auto px-6 md:px-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 font-mono text-xs text-muted">
            <li>
              <Link href="/" className="hover:text-dark transition-colors">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href="/portfolio"
                className="hover:text-dark transition-colors"
              >
                Portfolio
              </Link>
            </li>
            <li>/</li>
            <li className="text-dark">{cs.title}</li>
          </ol>
        </nav>

        {/* Tags */}
        <div className="flex items-center gap-3 mb-4">
          <span className="border border-[#0D0D0D] text-xs font-mono rounded-full px-3 py-1 uppercase tracking-wider">
            {cs.category}
          </span>
          <span
            className={`text-xs font-mono rounded-full px-3 py-1 border ${
              cs.status === "live"
                ? "border-green-500 text-green-600"
                : "border-amber-500 text-amber-600"
            }`}
          >
            {cs.status}
          </span>
          {cs.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-mono rounded-full px-3 py-1 bg-gray-100 text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1
          className="font-serif text-dark leading-[1.15]"
          style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
        >
          {cs.title}
        </h1>
        <p className="text-lg text-gray-500 mt-2 font-sans">{cs.subtitle}</p>
        <p className="text-sm text-gray-400 mt-1">
          {cs.client} · {cs.year}
        </p>

        {/* Live link */}
        {cs.link && (
          <a
            href={cs.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-mono text-[#E8533A] hover:underline mt-3"
          >
            Visit live project ↗
          </a>
        )}

        {/* Hero image */}
        <div className="relative w-full h-80 md:h-[420px] bg-[#F5F5F5] rounded-xl overflow-hidden mt-8">
          <Image
            src={cs.image}
            alt={`${cs.title} - ${cs.subtitle} built by GOATED. software agency Mumbai`}
            fill
            className="object-cover object-top"
            sizes="(max-width: 900px) 100vw, 900px"
            priority
          />
        </div>

        {/* Key stat */}
        <p className="text-3xl font-serif text-[#E8533A] mt-10">
          {cs.resultStat}
        </p>

        {/* The Problem */}
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-12 mb-3">
          {"// the problem"}
        </h2>
        <p className="text-base text-gray-700 leading-relaxed">
          {cs.problem}
        </p>

        {/* What We Built */}
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-12 mb-3">
          {"// what we built"}
        </h2>
        <p className="text-base text-gray-700 leading-relaxed">{cs.built}</p>

        {/* The Result */}
        <h2 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-12 mb-3">
          {"// the result"}
        </h2>
        <p className="text-base text-gray-700 leading-relaxed">
          {cs.result}
        </p>

        {/* Navigation */}
        <div className="border-t border-[#EEEEEE] mt-16 pt-8 flex justify-between items-center">
          <Link
            href={`/portfolio/${prevCs.id}`}
            className="text-sm font-mono text-muted hover:text-dark transition-colors"
          >
            ← {prevCs.title}
          </Link>
          <Link
            href="/portfolio"
            className="text-sm font-mono text-[#E8533A] hover:underline"
          >
            All case studies
          </Link>
          <Link
            href={`/portfolio/${nextCs.id}`}
            className="text-sm font-mono text-muted hover:text-dark transition-colors"
          >
            {nextCs.title} →
          </Link>
        </div>
      </article>

      <ContactFooter />
    </main>
  );
}
