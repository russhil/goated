import type { Metadata } from "next";
import "./globals.css";
import FooterBlur from "@/components/FooterBlur";

export const metadata: Metadata = {
  title: "GOATED. - Software & AI Automation Agency | Mumbai",
  description:
    "GOATED. is a software and AI automation agency based in Mumbai. We build custom software, AI-powered workflows, and automation systems that make your business unstoppable.",
  keywords: ["software agency", "AI automation", "Mumbai", "custom software", "automation"],
  openGraph: {
    title: "GOATED. - Software & AI Automation Agency",
    description: "We build custom software and AI automations from scratch. Software that makes your business unstoppable.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GOATED.",
    "url": "https://goated.dev",
    "description": "Software & AI Automation Agency based in Mumbai.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mumbai",
      "addressCountry": "IN"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {children}
        <FooterBlur />
      </body>
    </html>
  );
}
