'use client';

const logos = [
  { name: 'Azadi Records', file: 'Azadi (1).png' },
  { name: 'DlaN5', file: 'DlaN5 NP.png' },
  { name: 'Everest Fleet', file: 'Everest Fleet Logo.png' },
  { name: 'KPMG', file: 'KPMG Blue Logo.webp' },
  { name: 'Wear World Peace', file: 'Wear World Peace.png' },
];

// Duplicate 4x for seamless infinite loop (20 items)
const allLogos = [...logos, ...logos, ...logos, ...logos];

export default function LogoTicker() {
  return (
    <section
      style={{
        padding: '64px 0',
        borderTop: '1px solid #F0F0F0',
        borderBottom: '1px solid #F0F0F0',
        overflow: 'hidden',
      }}
    >
      {/* Label */}
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          letterSpacing: '0.2em',
          color: '#E8533A',
          textAlign: 'center',
          marginBottom: '40px',
          textTransform: 'lowercase',
        }}
      >
        {'// worked alongside'}
      </p>

      {/* Ticker wrapper */}
      <div className="overflow-hidden">
        <div className="ticker-track">
          {allLogos.map((logo, i) => (
            <div key={i} className="logo-item">
              <img
                src={`/${logo.file}`}
                alt={logo.name}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
