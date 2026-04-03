import type { Metadata } from "next";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroQuote from "@/components/HeroQuote";
import LogoTicker from "@/components/LogoTicker";
import WhatWeAre from "@/components/WhatWeAre";
import Industries from "@/components/Industries";
import WhatMakesDifferent from "@/components/WhatMakesDifferent";
import Team from "@/components/Team";
import ContactFooter from "@/components/ContactFooter";
import FAQ from "@/components/FAQ";
import { FAQS } from "@/lib/faqData";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Custom Software & AI Automation Agency in Mumbai",
  description:
    "GOATED. builds custom software, AI-powered workflows, and automation systems from scratch. A bespoke software development and AI automation agency in Mumbai serving businesses across India. No templates. No off-the-shelf solutions.",
  alternates: {
    canonical: "https://goatedd.tech",
  },
};

function PortfolioLink() {
  return (
    <section className="px-6 md:px-12 py-16 md:py-24 max-w-[1400px] mx-auto">
      <div className="section-label">{'// case studies'}</div>
      <h2
        className="font-serif text-[#0D0D0D] leading-[1.15] mb-6"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        What we&apos;ve built.
      </h2>
      <p className="font-sans text-gray-500 mb-4 max-w-2xl">
        Custom software development and AI automation projects for businesses across
        healthcare, music, e-commerce, and creative industries. All live and in production.
      </p>
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-2 text-[#E8533A] font-sans text-lg font-medium hover:underline transition-all"
      >
        View all case studies →
      </Link>
    </section>
  );
}

function FAQJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function Home() {
  return (
    <main>
      <FAQJsonLd />
      <CustomCursor />
      <Navbar />
      <HeroQuote />
      <LogoTicker />
      <WhatWeAre />
      <Industries />
      <WhatMakesDifferent />
      <PortfolioLink />
      <Team />
      <FAQ />
      <ContactFooter />
    </main>
  );
}
