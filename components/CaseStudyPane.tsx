'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { CaseStudy } from '@/lib/caseStudies';

interface CaseStudyPaneProps {
  caseStudy: CaseStudy | null;
  onClose: () => void;
  onNext: () => void;
}

export default function CaseStudyPane({ caseStudy, onClose, onNext }: CaseStudyPaneProps) {
  // Body scroll lock
  useEffect(() => {
    if (caseStudy) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [caseStudy]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-500 ${
          caseStudy ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Pane */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[60vw] bg-white z-50 overflow-y-auto shadow-2xl transition-transform duration-500`}
        style={{
          transform: caseStudy ? 'translateX(0)' : 'translateX(100%)',
          transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {caseStudy && (
          <>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-11 h-11 flex items-center justify-center text-3xl text-gray-400 hover:text-black transition-colors z-10"
              aria-label="Close case study"
            >
              ×
            </button>

            <div className="pt-16 px-8 md:px-12">
              {/* Tags */}
              <div className="flex items-center gap-3">
                <span className="border border-[#0D0D0D] text-xs font-mono rounded-full px-3 py-1 uppercase tracking-wider">
                  {caseStudy.category}
                </span>
                <span
                  className={`text-xs font-mono rounded-full px-3 py-1 border ${
                    caseStudy.status === 'live'
                      ? 'border-green-500 text-green-600'
                      : 'border-amber-500 text-amber-600'
                  }`}
                >
                  {caseStudy.status}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-serif mt-4">{caseStudy.title}</h2>
              <p className="text-sm text-gray-400 mt-2">
                {caseStudy.client} · {caseStudy.year}
              </p>

              {/* Live link */}
              {caseStudy.link && (
                <a
                  href={caseStudy.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-[#E8533A] hover:underline mt-1"
                >
                  ↗ {caseStudy.link.replace('https://', '')}
                </a>
              )}

              {/* Divider */}
              <div className="border-t border-[#EEEEEE] my-8" />

              {/* Screenshot */}
              <div className="relative w-full h-80 bg-[#F5F5F5] rounded-xl overflow-hidden">
                <Image
                  src={caseStudy.image}
                  alt={`${caseStudy.title} - ${caseStudy.subtitle} built by GOATED. software agency`}
                  fill
                  className="object-cover object-top"
                  sizes="60vw"
                />
              </div>

              {/* The Problem */}
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-10 mb-3">
                {'// the problem'}
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">{caseStudy.problem}</p>

              {/* What We Built */}
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-10 mb-3">
                {'// what we built'}
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">{caseStudy.built}</p>

              {/* The Result */}
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8533A] mt-10 mb-3">
                {'// the result'}
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">{caseStudy.result}</p>

              {/* Result Stat */}
              <p className="text-2xl font-serif text-[#E8533A] mt-6">{caseStudy.resultStat}</p>
            </div>

            {/* Bottom - Next Project */}
            <div className="border-t border-[#EEEEEE] mt-12 pt-8 px-8 md:px-12 pb-16">
              <button
                onClick={onNext}
                className="text-[#E8533A] font-mono text-sm cursor-pointer hover:underline"
              >
                {'// next project →'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
