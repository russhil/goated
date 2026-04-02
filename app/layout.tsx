import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import FooterBlur from "@/components/FooterBlur";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://goated.dev"),
  title: {
    default: "GOATED. | Custom Software & AI Automation Agency in Mumbai, India",
    template: "%s | GOATED.",
  },
  description:
    "GOATED. is a custom software development and AI automation agency based in Mumbai, India. We build bespoke software, AI-powered workflows, internal tools, and automation systems that make businesses unstoppable. No templates. No off-the-shelf solutions.",
  keywords: [
    "software agency",
    "AI automation agency",
    "custom software development",
    "AI agency",
    "software development company",
    "software agency Mumbai",
    "AI automation Mumbai",
    "custom software agency India",
    "business automation agency",
    "AI consulting agency",
    "AI workflow automation",
    "bespoke software development",
    "AI-powered business automation",
    "custom internal tools development",
    "software development services",
    "automation agency India",
    "AI solutions company",
    "custom CRM development",
    "business process automation",
    "digital transformation agency",
  ],
  authors: [{ name: "GOATED.", url: "https://goated.dev" }],
  creator: "GOATED.",
  publisher: "GOATED.",
  openGraph: {
    title: "GOATED. | Custom Software & AI Automation Agency",
    description:
      "We build custom software, AI automations, and internal tools from scratch. Bespoke solutions that make your business unstoppable.",
    url: "https://goated.dev",
    siteName: "GOATED.",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GOATED. | Custom Software & AI Automation Agency",
    description:
      "We build custom software, AI automations, and internal tools from scratch. Bespoke solutions that make your business unstoppable.",
  },
  alternates: {
    canonical: "https://goated.dev",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "GOATED.",
      url: "https://goated.dev",
      description: "Custom Software & AI Automation Agency based in Mumbai, India.",
    },
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "GOATED.",
      url: "https://goated.dev",
      logo: "https://goated.dev/icon.png",
      description:
        "GOATED. is a custom software development and AI automation agency based in Mumbai. We build bespoke software, AI-powered workflows, internal tools, and business automation systems.",
      serviceType: [
        "Custom Software Development",
        "AI Automation",
        "Business Process Automation",
        "Internal Tools Development",
        "AI Workflow Automation",
        "E-Commerce Development",
        "CRM Development",
      ],
      areaServed: [
        { "@type": "City", name: "Mumbai" },
        { "@type": "Country", name: "India" },
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Mumbai",
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: "19.0760",
        longitude: "72.8777",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@goatedd.tech",
        contactType: "sales",
        availableLanguage: ["English", "Hindi"],
      },
      founder: [
        {
          "@type": "Person",
          name: "Vansh Sood",
          jobTitle: "Engineer",
          sameAs: "https://linkedin.com/in/vanshsback",
        },
        {
          "@type": "Person",
          name: "Russhil Chawla",
          jobTitle: "Strategy & Growth",
          sameAs: "https://linkedin.com/in/rixx",
        },
      ],
      sameAs: [
        "https://linkedin.com/in/vanshsback",
        "https://linkedin.com/in/rixx",
      ],
      priceRange: "$$",
      knowsAbout: [
        "Custom Software Development",
        "Artificial Intelligence",
        "Business Automation",
        "AI Workflow Automation",
        "Internal Tools",
        "E-Commerce Solutions",
        "CRM Systems",
      ],
    },
  ];

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
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
