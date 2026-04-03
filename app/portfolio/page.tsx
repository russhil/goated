import type { Metadata } from "next";
import Navbar from '@/components/Navbar';
import ContactFooter from '@/components/ContactFooter';
import CaseStudyGrid from '@/components/CaseStudyGrid';
import CustomCursor from '@/components/CustomCursor';
import { caseStudies } from "@/lib/caseStudies";

export const metadata: Metadata = {
  title: "Our Work | Software & AI Automation Case Studies",
  description:
    "Explore GOATED.'s portfolio of custom software and AI automation projects. Case studies in healthcare booking systems, music catalogue management, e-commerce platforms, CRM development, and AI-powered productivity tools.",
  alternates: {
    canonical: "https://goatedd.tech/portfolio",
  },
  openGraph: {
    title: "Our Work | Software & AI Automation Case Studies | GOATED.",
    description:
      "Custom software and AI automation projects, all live and in production. See how we've helped businesses automate operations and scale.",
    url: "https://goatedd.tech/portfolio",
  },
};

function PortfolioJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "GOATED. Portfolio | Software & AI Case Studies",
    description: "Custom software and AI automation case studies by GOATED.",
    url: "https://goatedd.tech/portfolio",
    hasPart: caseStudies.map((cs) => ({
      "@type": "CreativeWork",
      name: cs.title,
      description: cs.description,
      creator: { "@type": "Organization", name: "GOATED." },
      ...(cs.link ? { url: cs.link } : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function PortfolioPage() {
  return (
    <main>
      <PortfolioJsonLd />
      <CustomCursor />
      <Navbar />
      <div className="pt-16">
        <CaseStudyGrid />
      </div>
      <ContactFooter />
    </main>
  );
}
