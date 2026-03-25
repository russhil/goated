'use client';

import { useState } from 'react';
import Image from 'next/image';
import { caseStudies, CaseStudy } from '@/lib/caseStudies';
import CaseStudyPane from './CaseStudyPane';

const FILTERS: { label: string; value: 'all' | 'client' | 'ai' | 'tools' }[] = [
  { label: 'SHOW ALL', value: 'all' },
  { label: 'CLIENT PROJECTS', value: 'client' },
  { label: 'AI AUTOMATION', value: 'ai' },
  { label: 'INTERNAL TOOLS', value: 'tools' },
];

export default function CaseStudyGrid() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'client' | 'ai' | 'tools'>('all');
  const [activeCaseStudy, setActiveCaseStudy] = useState<CaseStudy | null>(null);

  const filteredStudies =
    activeFilter === 'all'
      ? caseStudies
      : caseStudies.filter((cs) => cs.category === activeFilter);

  const handleNext = () => {
    if (!activeCaseStudy) return;
    const currentIndex = caseStudies.findIndex((cs) => cs.id === activeCaseStudy.id);
    const nextIndex = (currentIndex + 1) % caseStudies.length;
    setActiveCaseStudy(caseStudies[nextIndex]);
  };

  return (
    <>
      <section className="min-h-screen px-6 md:px-12 py-20 md:py-32 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-4 text-center">
          <span className="section-label">{'// case studies'}</span>
        </div>
        <h2
          className="font-serif text-[#0D0D0D] leading-[1.15] mb-4 text-center"
          style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}
        >
          What we&apos;ve built.
        </h2>
        <p className="font-sans text-gray-500 mb-10 text-center max-w-2xl mx-auto">
          Custom software and AI systems.
          <br />
          All live and in production.
        </p>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-3 mb-16 justify-center">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`rounded-full px-5 py-2 text-sm font-mono uppercase tracking-wider transition-all duration-200 ${
                activeFilter === f.value
                  ? 'bg-[#0D0D0D] text-white'
                  : 'border border-[#0D0D0D] text-[#0D0D0D] bg-white hover:bg-[#0D0D0D] hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {filteredStudies.map((cs) => (
            <div
              key={cs.id}
              onClick={() => setActiveCaseStudy(cs)}
              className="group border border-[#EEEEEE] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:border-[#E8533A]/30 hover:shadow-[0_0_0_1px_rgba(232,83,58,0.15),0_8px_32px_rgba(232,83,58,0.12),0_2px_8px_rgba(232,83,58,0.08)] hover:-translate-y-1"
            >
              {/* Screenshot area */}
              <div className="relative h-56 bg-[#F5F5F5] overflow-hidden">
                <Image
                  src={cs.image}
                  alt={cs.title}
                  fill
                  className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized
                />
              </div>

              {/* Card body */}
              <div className="p-7">
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#0D0D0D] text-xs font-mono rounded-full px-3 py-1 uppercase tracking-wider">
                    {cs.category}
                  </span>
                  <span
                    className={`text-xs font-mono rounded-full px-3 py-1 border ${
                      cs.status === 'live'
                        ? 'border-green-500 text-green-600'
                        : 'border-amber-500 text-amber-600'
                    }`}
                  >
                    {cs.status}
                  </span>
                </div>

                {/* Project name */}
                <h3 className="text-xl font-bold font-sans mt-3">{cs.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{cs.client}</p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{cs.description}</p>

                {/* Stat */}
                <p className="text-2xl font-serif text-[#E8533A] mt-4">{cs.stat}</p>

                {/* CTA */}
                <p className="text-[#E8533A] text-sm mt-4 hover:underline cursor-pointer">
                  View Case Study →
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Slide-in Pane */}
      <CaseStudyPane
        caseStudy={activeCaseStudy}
        onClose={() => setActiveCaseStudy(null)}
        onNext={handleNext}
      />
    </>
  );
}
