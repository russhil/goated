'use client';

import Image from 'next/image';

const logos = [
  { name: 'Azadi Records', file: 'logos/azadi.png' },
  { name: 'NBA', file: 'logos/nba.png' },
  { name: 'DlaN5', file: 'DlaN5 NP.png' },
  { name: 'Kiko Live', file: 'logos/kikolive.png' },
  { name: 'Everest Fleet', file: 'logos/everestfleet.png' },
  { name: 'KPMG', file: 'KPMG Blue Logo.webp' },
  { name: 'Partner', file: 'logos/partner1.png' },
  { name: 'Wear World Peace', file: 'logos/wearworldpeace.png' },
];

const newsLogos = [
  { name: 'Hindustan Times', file: 'logos/news/hindustantimes.png' },
  { name: 'News18', file: 'logos/news/news18.png' },
  { name: 'Firstpost', file: 'logos/news/firstpost.png' },
  { name: 'Mumbai Live', file: 'logos/news/mumbailive.png' },
  { name: 'Radio City', file: 'logos/news/radiocity.png' },
  { name: 'Radio Mirchi', file: 'logos/news/radiomirchi.png' },
];

// Duplicate 2x for seamless infinite loop
const allLogos = [...logos, ...logos];

export default function LogoTicker() {
  return (
    <section className="py-12 md:py-16 border-y border-[#F0F0F0] overflow-hidden">
      {/* Label */}
      <p className="font-mono text-[11px] tracking-[0.2em] text-coral text-center mb-10 lowercase">
        {'// worked alongside'}
      </p>

      {/* Ticker wrapper */}
      <div className="overflow-hidden">
        <div className="ticker-track">
          {allLogos.map((logo, i) => (
            <div key={i} className="logo-item">
              <Image
                src={`/${logo.file}`}
                alt={logo.name}
                width={120}
                height={32}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Featured In section */}
      <div className="mt-12 pt-8 border-t border-[#F0F0F0]">
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted text-center mb-8 lowercase">
          {'// founders featured in'}
        </p>

        <div className="flex items-center justify-center flex-wrap gap-10 max-w-[900px] mx-auto px-6">
          {newsLogos.map((logo, i) => (
            <div key={i} className="news-logo-item">
              <Image
                src={`/${logo.file}`}
                alt={logo.name}
                width={120}
                height={24}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
