"use client";

import { useRef } from "react";
import Image from "next/image";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const TEAM = [
  {
    name: "Vansh Sood",
    role: "Engineer",
    detail: "B.E. BITS Pilani",
    photo: "/vansh-sood.jpg",
    linkedin: "https://linkedin.com/in/vanshsback",
  },
  {
    name: "Russhil Chawla",
    role: "Strategy & Growth",
    detail: "Final Year, IIM",
    photo: "/russhil-chawla.jpg",
    linkedin: "https://linkedin.com/in/rixx",
  },
];

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealOnScroll(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="team"
      className="py-20 md:py-32 px-6 md:px-16 text-center max-w-[1400px] mx-auto"
    >
      <div className="section-label reveal">// the team</div>

      <h2
        className="font-serif text-dark leading-[1.15] mb-8 reveal"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        Small team. Serious output.
      </h2>

      <p className="max-w-xl mx-auto text-center text-base text-gray-500 leading-relaxed mb-20 reveal">
        We built GOATED. because we kept seeing the same problem -
        brilliant businesses held back by manual processes and generic
        tools. We&apos;re engineers and operators, based in Mumbai.
        We fix that.
      </p>

      {/* Founder cards */}
      <div className="flex justify-center gap-12 flex-wrap stagger-children">
        {TEAM.map((member, i) => (
          <div
            key={i}
            className="reveal flex flex-col items-center text-center max-w-xs"
          >
            {/* Photo */}
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto ring-1 ring-[#EEEEEE]">
              <Image
                src={member.photo}
                alt={`${member.name} - ${member.role} at GOATED. software agency Mumbai`}
                width={112}
                height={112}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="mt-5 flex items-center justify-center gap-2">
              <h4 className="text-lg font-bold text-[#0D0D0D] text-center">
                {member.name}
              </h4>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-[#0077b5] transition-colors"
                aria-label={`${member.name}'s LinkedIn`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
            <p className="text-sm text-[#E8533A] mt-1 text-center">
              {member.role}
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {member.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
