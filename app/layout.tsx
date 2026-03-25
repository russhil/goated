import type { Metadata } from "next";
import "./globals.css";
import FooterBlur from "@/components/FooterBlur";

export const metadata: Metadata = {
  title: "GOATED. — Software & AI Automation Agency | Mumbai",
  description:
    "GOATED. is a software and AI automation agency based in Mumbai. We build custom software, AI-powered workflows, and automation systems that make your business unstoppable.",
  keywords: ["software agency", "AI automation", "Mumbai", "custom software", "automation"],
  openGraph: {
    title: "GOATED. — Software & AI Automation Agency",
    description: "We build custom software and AI automations from scratch. Software that makes your business unstoppable.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <FooterBlur />
      </body>
    </html>
  );
}
