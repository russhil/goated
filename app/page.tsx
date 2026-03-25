import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import HeroQuote from "@/components/HeroQuote";
import LogoTicker from "@/components/LogoTicker";
import WhatWeAre from "@/components/WhatWeAre";
import Industries from "@/components/Industries";
import WhatMakesDifferent from "@/components/WhatMakesDifferent";
import Team from "@/components/Team";
import ContactFooter from "@/components/ContactFooter";
import Link from "next/link";

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
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-2 text-[#E8533A] font-sans text-lg font-medium hover:underline transition-all"
      >
        View our work →
      </Link>
    </section>
  );
}

export default function Home() {
  return (
    <main>
      <CustomCursor />
      <Navbar />
      <HeroQuote />
      <LogoTicker />
      <WhatWeAre />
      <Industries />
      <WhatMakesDifferent />
      <PortfolioLink />
      <Team />
      <ContactFooter />
    </main>
  );
}
