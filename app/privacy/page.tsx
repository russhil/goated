import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_CONTACT, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "Privacy policy for goatedd.tech and its lead forms",
  alternates: { canonical: "https://goatedd.tech/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-16 md:px-12 md:py-24">
      <Link href="/" className="font-mono text-sm tracking-tight text-dark">
        [<span className="font-bold">GOATED</span>
        <span className="font-bold text-coral">.</span>]
      </Link>

      <p className="section-label mt-14">{"// legal"}</p>
      <h1 className="font-serif leading-[1.1] text-dark" style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)" }}>
        Privacy policy
      </h1>
      <p className="mt-4 font-mono text-xs uppercase tracking-[0.14em] text-muted">
        Updated {PRIVACY_UPDATED}
      </p>

      <div className="mt-12 border-b border-dark/10">
        {PRIVACY_SECTIONS.map((section) => (
          <section key={section.heading} className="border-t border-dark/10 py-8">
            <h2 className="font-serif text-2xl text-dark">{section.heading}</h2>
            {section.intro && (
              <p className="mt-3 font-sans text-base leading-relaxed text-gray-600">{section.intro}</p>
            )}
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex gap-3 font-sans text-base leading-relaxed text-gray-700">
                  <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-coral" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 font-sans text-base text-gray-700">
        Contact:{" "}
        <a href={`mailto:${PRIVACY_CONTACT}`} className="link-underline text-coral">
          {PRIVACY_CONTACT}
        </a>
      </p>
    </main>
  );
}
