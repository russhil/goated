"use client";

import { useState, useRef } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { FAQS } from "@/lib/faqData";

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useRevealOnScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="py-20 md:py-32 px-6 md:px-16 max-w-[900px] mx-auto"
    >
      <div className="section-label reveal">{"// frequently asked questions"}</div>

      <h2
        className="font-serif text-dark leading-[1.15] mb-12 reveal"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        Questions we get asked.
      </h2>

      <div className="flex flex-col reveal">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="border-t border-[#EEEEEE]">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between py-6 text-left group"
                aria-expanded={isOpen}
              >
                <h3 className="font-sans text-base md:text-lg font-medium text-dark pr-8 group-hover:text-coral transition-colors">
                  {faq.question}
                </h3>
                <span
                  className="text-2xl text-muted flex-shrink-0 transition-transform duration-300"
                  style={{
                    transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                >
                  +
                </span>
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{
                  maxHeight: isOpen ? "500px" : "0",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <p className="font-sans text-sm text-gray-500 leading-relaxed pb-6">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
        <div className="border-t border-[#EEEEEE]" />
      </div>
    </section>
  );
}

