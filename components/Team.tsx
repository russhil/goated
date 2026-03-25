"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const TEAM = [
  {
    name: "Vansh Sood",
    role: "Engineer",
    detail: "B.E. BITS Pilani",
    photo: "/Parchi AI Image (1).jpg",
  },
  {
    name: "Russhil Chawla",
    role: "Strategy & Growth",
    detail: "Final Year, IIM",
    photo: "/Parchi AI Image.jpg",
  },
];

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const reveals = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

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
        We built GOATED. because we kept seeing the same problem —
        brilliant businesses held back by manual processes and generic
        tools. We&apos;re engineers and operators, based in Mumbai.
        We fix that.
      </p>

      {/* Founder cards */}
      <div className="flex justify-center gap-20 flex-wrap stagger-children">
        {TEAM.map((member, i) => (
          <div
            key={i}
            className="reveal flex flex-col items-center text-center max-w-xs"
          >
            {/* Photo */}
            <div className="w-28 h-28 rounded-full overflow-hidden mx-auto ring-1 ring-[#EEEEEE]">
              <Image
                src={member.photo}
                alt={member.name}
                width={112}
                height={112}
                className="w-full h-full object-cover object-top"
                unoptimized
              />
            </div>
            <h4 className="text-lg font-bold text-[#0D0D0D] mt-5 text-center">
              {member.name}
            </h4>
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
