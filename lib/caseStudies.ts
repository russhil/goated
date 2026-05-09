export type CaseStudy = {
  id: string;
  category: 'client' | 'ai' | 'tools';
  tags: string[];
  status: 'live' | 'building';
  title: string;
  subtitle: string;
  client: string;
  year: string;
  description: string;
  stat: string;
  problem: string;
  built: string;
  result: string;
  resultStat: string;
  mockupSvg: string;
  image: string;
  link?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    id: 'azadi',
    image: '/AZR.png',
    category: 'tools',
    tags: ['MUSIC', 'CATALOGUE MANAGEMENT'],
    status: 'live',
    title: 'Azadi Records',
    subtitle: 'Music Catalogue System',
    client: 'Azadi Records, Mumbai',
    year: '2024',
    description:
      'We took 100+ spreadsheets across artists, royalties, splits and ISRC codes and collapsed them into one unified catalogue system. Now expanding to all labels on the roster including Seedhe Maut, with an artist-facing app in development.',
    stat: '100+ spreadsheets → 1 system',
    problem:
      'Azadi Records managed their entire catalogue — 32+ releases, multiple artists, complex royalty splits — across 100 disconnected spreadsheets. Every release meant hours of manual updates, and mistakes were inevitable.',
    built:
      'A centralised catalogue management system with a live overview dashboard, ISRC tracking, automated split calculations, and a licensor management module. Built in React with a Supabase backend.',
    result:
      'Onboarded in a single day. Expanding to every label on the Azadi roster. Artist-facing app in development.',
    resultStat: '100+ spreadsheets. One dashboard.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#F8F8F8"/>
      <rect x="0" y="0" width="48" height="260" fill="#EEEEEE" rx="8"/>
      <circle cx="24" cy="40" r="6" fill="#CCCCCC"/>
      <circle cx="24" cy="60" r="6" fill="#CCCCCC"/>
      <circle cx="24" cy="80" r="6" fill="#E8533A"/>
      <rect x="68" y="20" width="72" height="44" rx="6" fill="white" stroke="#EEEEEE"/>
      <text x="104" y="48" text-anchor="middle" font-size="14" font-weight="bold" fill="#0D0D0D">32</text>
      <rect x="148" y="20" width="72" height="44" rx="6" fill="white" stroke="#EEEEEE"/>
      <text x="184" y="48" text-anchor="middle" font-size="14" font-weight="bold" fill="#0D0D0D">10</text>
      <rect x="228" y="20" width="72" height="44" rx="6" fill="white" stroke="#EEEEEE"/>
      <text x="264" y="48" text-anchor="middle" font-size="14" font-weight="bold" fill="#0D0D0D">25</text>
      <rect x="308" y="20" width="72" height="44" rx="6" fill="white" stroke="#EEEEEE"/>
      <text x="344" y="48" text-anchor="middle" font-size="14" font-weight="bold" fill="#0D0D0D">5</text>
      <path d="M68 120 Q120 90 180 105 Q240 120 300 95 Q340 85 380 100 L380 160 L68 160 Z" fill="#2DD4BF" opacity="0.2"/>
      <path d="M68 120 Q120 90 180 105 Q240 120 300 95 Q340 85 380 100" stroke="#2DD4BF" stroke-width="2" fill="none"/>
      <rect x="68" y="175" width="312" height="22" rx="4" fill="white" stroke="#EEEEEE"/>
      <text x="78" y="190" font-size="10" font-family="monospace" fill="#3B82F6">AZR000</text>
      <text x="140" y="190" font-size="10" fill="#999">Track Title - Artist</text>
      <rect x="68" y="201" width="312" height="22" rx="4" fill="white" stroke="#EEEEEE"/>
      <text x="78" y="216" font-size="10" font-family="monospace" fill="#3B82F6">AZR001</text>
      <text x="140" y="216" font-size="10" fill="#999">Track Title - Artist</text>
      <rect x="68" y="227" width="312" height="22" rx="4" fill="white" stroke="#EEEEEE"/>
      <text x="78" y="242" font-size="10" font-family="monospace" fill="#3B82F6">AZR002</text>
      <text x="140" y="242" font-size="10" fill="#999">Track Title - Artist</text>
    </svg>`,
  },
  {
    id: 'movement',
    image: '/MBD.png',
    category: 'client',
    tags: ['HEALTHCARE', 'BOOKING SYSTEM'],
    status: 'live',
    title: 'Movement by Design',
    subtitle: 'Clinic Booking & Patient Management',
    client: 'Movement by Design, South Bombay',
    link: 'https://movementbydesign.in',
    year: '2025',
    description:
      'A custom booking and patient management system for a physiotherapy clinic in South Bombay. Replaces phone bookings and paper files entirely.',
    stat: '100% bookings automated',
    problem:
      'A busy physiotherapy practice in South Bombay was managing all appointments over WhatsApp and phone calls. No cancellation flow, no reminders, double-bookings were common, and patient history lived in paper files.',
    built:
      'A custom booking system with online scheduling, automated WhatsApp reminders 24hrs before appointments, a patient history module with session notes, and an admin dashboard showing the week at a glance.',
    result:
      'No-shows reduced by 60%. The practice runs its full schedule without a single phone call for bookings. Patient records are now searchable and persistent.',
    resultStat: '60% fewer no-shows.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#F8F8F8"/>
      <rect x="0" y="0" width="80" height="260" fill="#FAFAFA" rx="8"/>
      <circle cx="20" cy="50" r="8" fill="#DDDDDD"/>
      <rect x="34" y="46" width="36" height="8" rx="2" fill="#DDDDDD"/>
      <circle cx="20" cy="80" r="8" fill="#DDDDDD"/>
      <rect x="34" y="76" width="36" height="8" rx="2" fill="#DDDDDD"/>
      <circle cx="20" cy="110" r="8" fill="#DDDDDD"/>
      <rect x="34" y="106" width="36" height="8" rx="2" fill="#DDDDDD"/>
      <text x="100" y="30" font-size="9" fill="#999" font-weight="500">MON</text>
      <text x="150" y="30" font-size="9" fill="#999" font-weight="500">TUE</text>
      <text x="200" y="30" font-size="9" fill="#999" font-weight="500">WED</text>
      <text x="250" y="30" font-size="9" fill="#999" font-weight="500">THU</text>
      <text x="300" y="30" font-size="9" fill="#999" font-weight="500">FRI</text>
      <text x="350" y="30" font-size="9" fill="#999" font-weight="500">SAT</text>
      ${Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 6 }, (_, col) => {
        const x = 95 + col * 50;
        const y = 40 + row * 50;
        const booked = (row === 0 && col === 1) || (row === 1 && col === 0) || (row === 2 && col === 3) || (row === 1 && col === 4) || (row === 3 && col === 2);
        return `<rect x="${x}" y="${y}" width="42" height="40" rx="4" fill="${booked ? '#E8533A' : 'white'}" opacity="${booked ? '0.8' : '1'}" stroke="#EEEEEE" stroke-width="1"/>`;
      }).join('')
    ).join('')}
      <rect x="310" y="6" width="80" height="22" rx="11" fill="#E8533A"/>
      <text x="350" y="21" text-anchor="middle" font-size="9" fill="white" font-weight="500">+ New Booking</text>
    </svg>`,
  },
  {
    id: 'psy-crm',
    image: '/PSY-CRM.png',
    category: 'tools',
    tags: ['CREATIVE', 'CRM'],
    status: 'live',
    title: 'PSY CRM',
    subtitle: 'Tattoo Studio Client Management',
    client: 'PSY Tattoo Studio, Mumbai',
    year: '2024',
    description:
      'A bespoke CRM for a tattoo studio - manages client consultations, artist assignments, design references, and deposit collection in one system.',
    stat: '3hrs saved per day on admin',
    problem:
      "PSY Tattoo Studio was tracking client consultations through Instagram DMs, a shared Notes app, and verbal communication. Deposits were missed, reference images were lost, and no one knew which artist was assigned to which client.",
    built:
      'A fully custom CRM with a client pipeline (lead → consultation → confirmed → completed), artist assignment, design reference uploads, deposit tracking, and automated appointment reminders.',
    result:
      "Zero missed deposits since launch. Every artist knows exactly what they're working on. The studio runs 3 hours shorter admin days.",
    resultStat: '0 missed deposits since launch.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#1A1A1A"/>
      <rect x="0" y="0" width="160" height="260" fill="#222222" rx="8"/>
      <text x="16" y="30" font-size="10" fill="#666" font-weight="500">CLIENTS</text>
      <rect x="12" y="42" width="136" height="32" rx="4" fill="#2A2A2A"/>
      <rect x="20" y="52" width="30" height="12" rx="6" fill="#E8533A" opacity="0.8"/>
      <text x="58" y="62" font-size="9" fill="#AAA">Rahul M.</text>
      <rect x="12" y="80" width="136" height="32" rx="4" fill="#2A2A2A"/>
      <rect x="20" y="90" width="30" height="12" rx="6" fill="#F59E0B" opacity="0.8"/>
      <text x="58" y="100" font-size="9" fill="#AAA">Priya S.</text>
      <rect x="12" y="118" width="136" height="32" rx="4" fill="#2A2A2A"/>
      <rect x="20" y="128" width="30" height="12" rx="6" fill="#22C55E" opacity="0.8"/>
      <text x="58" y="138" font-size="9" fill="#AAA">Amit K.</text>
      <rect x="12" y="156" width="136" height="32" rx="4" fill="#2A2A2A"/>
      <rect x="20" y="166" width="30" height="12" rx="6" fill="#22C55E" opacity="0.8"/>
      <text x="58" y="176" font-size="9" fill="#AAA">Sara J.</text>
      <rect x="12" y="194" width="136" height="32" rx="4" fill="#2A2A2A"/>
      <rect x="20" y="204" width="30" height="12" rx="6" fill="#666" opacity="0.8"/>
      <text x="58" y="214" font-size="9" fill="#AAA">Dev P.</text>
      <rect x="176" y="40" width="208" height="160" rx="8" fill="#2A2A2A"/>
      <text x="192" y="68" font-size="13" fill="white" font-weight="600">Rahul M.</text>
      <text x="192" y="96" font-size="10" fill="#888">Ref Images: 3</text>
      <text x="192" y="116" font-size="10" fill="#888">Artist: Assigned</text>
      <text x="192" y="136" font-size="10" fill="#22C55E">Deposit: ✓</text>
      <rect x="296" y="10" width="88" height="24" rx="12" fill="#E8533A"/>
      <text x="340" y="26" text-anchor="middle" font-size="9" fill="white" font-weight="500">New Client +</text>
    </svg>`,
  },
  {
    id: 'parchi',
    image: '/PARCHI.png',
    category: 'ai',
    tags: ['AI', 'PRODUCTIVITY'],
    status: 'building',
    title: 'Parchi AI',
    subtitle: 'AI-Powered Capture Tool',
    client: 'Parchi Technologies',
    link: 'https://www.parchi.tech',
    year: '2025',
    description:
      'Parchi is a tool that automates clinic operations across India - appointments, records, billing, and patient communication in one place.',
    stat: 'Captures 10x faster than manual notes',
    problem:
      'Important thoughts, tasks, and ideas disappear between the moment they occur and when you sit down to action them. Existing note apps require too much friction for fast capture.',
    built:
      'A fast-capture AI tool where you drop any thought - voice or text - and Parchi automatically categorises it, extracts action items, sets reminders, and surfaces related items when context matches. Inspired by parchi.tech.',
    result:
      'Currently in beta. Early users report capturing 3x more actionable tasks daily versus traditional note apps.',
    resultStat: '3x more tasks captured daily.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#F8F8F8"/>
      <rect x="120" y="10" width="160" height="240" rx="24" fill="#1A1A1A" stroke="#333" stroke-width="1.5"/>
      <rect x="134" y="44" width="132" height="42" rx="8" fill="#2A2A2A"/>
      <text x="144" y="62" font-size="9" fill="white">Call Amit about launch</text>
      <rect x="144" y="72" width="36" height="10" rx="5" fill="#E8533A" opacity="0.8"/>
      <text x="148" y="80" font-size="6" fill="white">TASK</text>
      <rect x="134" y="94" width="132" height="42" rx="8" fill="#2A2A2A"/>
      <text x="144" y="112" font-size="9" fill="white">Blog post ideas for Q2</text>
      <rect x="144" y="122" width="28" height="10" rx="5" fill="#3B82F6" opacity="0.8"/>
      <text x="148" y="130" font-size="6" fill="white">IDEA</text>
      <rect x="134" y="144" width="132" height="42" rx="8" fill="#2A2A2A"/>
      <text x="144" y="162" font-size="9" fill="white">Review PR #42 tonight</text>
      <rect x="144" y="172" width="36" height="10" rx="5" fill="#E8533A" opacity="0.8"/>
      <text x="148" y="180" font-size="6" fill="white">TASK</text>
      <rect x="134" y="204" width="96" height="28" rx="14" fill="#2A2A2A" stroke="#444"/>
      <text x="144" y="222" font-size="9" fill="#666">Type or speak…</text>
      <circle cx="248" cy="218" r="12" fill="#E8533A"/>
      <rect x="244" y="212" width="2" height="12" rx="1" fill="white"/>
      <rect x="248" y="212" width="2" height="12" rx="1" fill="white"/>
      <rect x="240" y="215" width="2" height="6" rx="1" fill="white"/>
      <rect x="252" y="215" width="2" height="6" rx="1" fill="white"/>
    </svg>`,
  },
  {
    id: 'psy-shop',
    image: '/PSY-WEB.png',
    category: 'client',
    tags: ['E-COMMERCE', 'WEB'],
    status: 'live',
    title: 'PSY Website + Shop',
    subtitle: 'Brand Site & Merch Storefront',
    client: 'PSY Tattoo Studio, Mumbai',
    link: 'https://psy-website-kappa.vercel.app/studio',
    year: '2024',
    description:
      'A full brand website and e-commerce storefront - merch ordering, artist portfolios, appointment booking, and a backend order management CRM.',
    stat: '50 merch orders in week 1',
    problem:
      'PSY Studio had no web presence beyond Instagram. Merch drops were managed through DMs, orders tracked in WhatsApp groups, and there was no way to browse artist portfolios or book online.',
    built:
      'A complete brand website with artist portfolio pages, an e-commerce store for merch drops with inventory management, integrated booking flow, and a backend order management system.',
    result:
      'Launched to 50 merch orders in the first week. Booking requests increased 3x from organic web traffic. The studio team manages all orders from one dashboard.',
    resultStat: '3x booking increase from web traffic.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#1A1A1A"/>
      <rect x="0" y="0" width="400" height="18" rx="8" fill="#222"/>
      <circle cx="16" cy="9" r="3" fill="#444"/>
      <circle cx="28" cy="9" r="3" fill="#444"/>
      <circle cx="40" cy="9" r="3" fill="#444"/>
      <text x="200" y="13" text-anchor="middle" font-size="7" fill="#666">Home   Artists   Shop   Book</text>
      <rect x="0" y="18" width="400" height="120" fill="#2A2A2A"/>
      <text x="200" y="88" text-anchor="middle" font-size="36" font-weight="bold" fill="white" letter-spacing="8">PSY</text>
      <rect x="30" y="150" width="100" height="90" rx="8" fill="#2A2A2A"/>
      <text x="80" y="196" text-anchor="middle" font-size="11" fill="white" font-weight="500">MERCH</text>
      <text x="80" y="216" text-anchor="middle" font-size="9" fill="#888">₹1,499</text>
      <rect x="148" y="150" width="100" height="90" rx="8" fill="#2A2A2A"/>
      <text x="198" y="196" text-anchor="middle" font-size="11" fill="white" font-weight="500">MERCH</text>
      <text x="198" y="216" text-anchor="middle" font-size="9" fill="#888">₹1,999</text>
      <rect x="266" y="150" width="100" height="90" rx="8" fill="#2A2A2A"/>
      <text x="316" y="196" text-anchor="middle" font-size="11" fill="white" font-weight="500">MERCH</text>
      <text x="316" y="216" text-anchor="middle" font-size="9" fill="#888">₹2,499</text>
    </svg>`,
  },
  {
    id: 'wwp',
    image: '/wear-world-peace.png',
    category: 'client',
    tags: ['FASHION', 'E-COMMERCE'],
    status: 'live',
    title: 'Wear World Peace',
    subtitle: 'E-Commerce & Operations',
    client: 'Wear World Peace',
    link: 'https://www.wearworldpeace.com/',
    year: '2025',
    description:
      'Built the full e-commerce infrastructure for Wear World Peace - the clothing brand founded by NBA player Ron Artest (Metta World Peace). A complete online store with shipping, operations, order management, and remarketing.',
    stat: 'From zero web presence to full storefront',
    problem:
      'Wear World Peace - the clothing brand founded by NBA champion Ron Artest - had built strong demand through Instagram but didn\'t have a dedicated website. The brand needed a proper online home to showcase collections, handle orders at scale, and support their growing customer base.',
    built:
      'A fully functional e-commerce website with product catalogue, collections, cart and checkout. On top of the storefront, we set up shipping logistics, order management, inventory tracking, and remarketing flows to drive repeat purchases.',
    result:
      'The brand now has a complete online storefront and a fully operational backend. Orders flow seamlessly from checkout to delivery, remarketing brings customers back, and the team manages everything from one dashboard.',
    resultStat: 'Zero to fully operational e-commerce.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="white" stroke="#EEEEEE"/>
      <rect x="0" y="0" width="400" height="24" fill="#FAFAFA"/>
      <text x="200" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#0D0D0D" letter-spacing="3">WWP</text>
      <rect x="20" y="36" width="360" height="80" rx="6" fill="#F5F5F5"/>
      <text x="200" y="80" text-anchor="middle" font-size="11" fill="#BBBBBB">NEW COLLECTION - SS25</text>
      <rect x="20" y="128" width="170" height="52" rx="6" fill="#F5F5F5"/>
      <text x="105" y="158" text-anchor="middle" font-size="9" fill="#BBBBBB">Product Image</text>
      <text x="105" y="174" text-anchor="middle" font-size="8" fill="#999">₹2,999</text>
      <rect x="210" y="128" width="170" height="52" rx="6" fill="#F5F5F5"/>
      <text x="295" y="158" text-anchor="middle" font-size="9" fill="#BBBBBB">Product Image</text>
      <text x="295" y="174" text-anchor="middle" font-size="8" fill="#999">₹3,499</text>
      <rect x="20" y="194" width="170" height="52" rx="6" fill="#F5F5F5"/>
      <text x="105" y="224" text-anchor="middle" font-size="9" fill="#BBBBBB">Product Image</text>
      <text x="105" y="240" text-anchor="middle" font-size="8" fill="#999">₹1,999</text>
      <rect x="210" y="194" width="170" height="52" rx="6" fill="#F5F5F5"/>
      <text x="295" y="224" text-anchor="middle" font-size="9" fill="#BBBBBB">Product Image</text>
      <text x="295" y="240" text-anchor="middle" font-size="8" fill="#999">₹4,499</text>
    </svg>`,
  },
  {
    id: 'zenspace',
    image: '/zenspace.png',
    category: 'client',
    tags: ['CREATIVE', 'BRAND SITE'],
    status: 'live',
    title: 'Zenspace',
    subtitle: 'Tattoo Studio Brand Site',
    client: 'Zenspace Tattoo Studio',
    year: '2025',
    description:
      'A complete brand site for Zenspace — categories, artist directory, piercing services, and a streamlined "Book consultation" flow. Built to convert browsers into bookings.',
    stat: 'Brand site → consultation pipeline',
    problem:
      'Zenspace was sending prospective clients to Instagram. With no website, every consultation request was a manual DM thread, artist portfolios were scattered, and there was no way to filter by style or artist before reaching out.',
    built:
      'A full brand website with category-based navigation (tattoos, piercing, custom), artist directory with portfolios, and a single "Book consultation" CTA wired to WhatsApp. Soft purple gradient design, smooth navigation, mobile-first.',
    result:
      'Consultation requests now arrive pre-qualified — clients pick their artist and style before messaging. The Instagram-only era is over.',
    resultStat: 'Pre-qualified consults from day one.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="zen-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F5F0FF"/>
          <stop offset="100%" stop-color="#E8DFFF"/>
        </linearGradient>
      </defs>
      <rect width="400" height="260" rx="8" fill="url(#zen-bg)"/>
      <rect x="40" y="20" width="320" height="36" rx="18" fill="white" opacity="0.6"/>
      <circle cx="60" cy="38" r="8" fill="#7C3AED" opacity="0.7"/>
      <text x="76" y="42" font-size="9" fill="#0D0D0D" font-weight="600">Zenspace</text>
      <text x="160" y="42" font-size="8" fill="#666">Home</text>
      <text x="200" y="42" font-size="8" fill="#666">Category</text>
      <text x="252" y="42" font-size="8" fill="#666">Artists</text>
      <text x="290" y="42" font-size="8" fill="#666">Contact</text>
      <rect x="318" y="28" width="38" height="20" rx="10" fill="#0D0D0D"/>
      <text x="337" y="41" text-anchor="middle" font-size="7" fill="white" font-weight="500">Book</text>
      <circle cx="200" cy="98" r="8" fill="none" stroke="#0D0D0D" stroke-width="1.5"/>
      <text x="200" y="130" text-anchor="middle" font-size="11" font-style="italic" font-family="serif" fill="#0D0D0D">A place where we create</text>
      <text x="200" y="146" text-anchor="middle" font-size="11" font-style="italic" font-family="serif" fill="#0D0D0D">your story</text>
      <rect x="20" y="170" width="68" height="80" rx="6" fill="white" opacity="0.7"/>
      <rect x="96" y="170" width="68" height="80" rx="6" fill="white" opacity="0.7"/>
      <rect x="172" y="170" width="68" height="80" rx="6" fill="white" opacity="0.7"/>
      <rect x="248" y="170" width="68" height="80" rx="6" fill="white" opacity="0.7"/>
      <rect x="324" y="170" width="56" height="80" rx="6" fill="white" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'inkdesk',
    image: '/inkdesk.png',
    category: 'tools',
    tags: ['CREATIVE', 'CRM', 'TATTOO'],
    status: 'live',
    title: 'InkDesk',
    subtitle: 'Tattoo Studio Operating System',
    client: 'GOATED. (in-house product)',
    link: 'https://inkdesk.goatedd.tech/dashboard',
    year: '2025',
    description:
      'A purpose-built CRM for tattoo studios — orders, customers, artists, expenses, campaigns and finance in one operating system. Built from learnings on PSY CRM and being rolled out as a productized offering.',
    stat: 'One dashboard for the whole studio',
    problem:
      'Tattoo studios juggle artist payouts, deposit tracking, customer source attribution, and expense logging across spreadsheets and notes. Existing CRMs are built for sales teams, not artists. Studios needed a single tool built for how they actually work.',
    built:
      'A dashboard-first studio operating system: System Overview with revenue/orders/customers/avg-order metrics, recent orders feed, top artists leaderboard with payout splits, customer source breakdown (Instagram, referral, walk-in), expense logging, and a campaigns module. Multi-tenant from day one.',
    result:
      'Live at inkdesk.goatedd.tech. Onboarding studios now — replacing the spreadsheet chaos with a clean, opinionated workflow.',
    resultStat: 'Spreadsheets → operating system.',
    mockupSvg: `<svg viewBox="0 0 400 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="260" rx="8" fill="#FBF7F2"/>
      <rect x="0" y="0" width="92" height="260" fill="white"/>
      <text x="14" y="26" font-size="9" font-weight="700" fill="#0D0D0D" letter-spacing="1">INKDESK</text>
      <text x="14" y="38" font-size="6" fill="#999" letter-spacing="1">BY GOATED</text>
      <rect x="8" y="54" width="76" height="22" rx="6" fill="#E8F5EE"/>
      <text x="20" y="68" font-size="8" fill="#16A34A" font-weight="600">Dashboard</text>
      <text x="20" y="92" font-size="8" fill="#666">Customers</text>
      <text x="20" y="110" font-size="8" fill="#666">Orders</text>
      <text x="20" y="128" font-size="8" fill="#666">Artists</text>
      <text x="20" y="146" font-size="8" fill="#666">Campaigns</text>
      <text x="20" y="164" font-size="8" fill="#666">Finance</text>
      <text x="108" y="32" font-size="14" font-family="serif" font-weight="600" fill="#0D0D0D">System Overview</text>
      <text x="108" y="46" font-size="7" fill="#999">Welcome back, admin</text>
      <rect x="108" y="58" width="60" height="40" rx="4" fill="white"/>
      <text x="114" y="72" font-size="6" fill="#666">Revenue</text>
      <text x="114" y="90" font-size="11" fill="#0D0D0D" font-weight="700">₹2,500</text>
      <rect x="174" y="58" width="60" height="40" rx="4" fill="white"/>
      <text x="180" y="72" font-size="6" fill="#666">Orders</text>
      <text x="180" y="90" font-size="11" fill="#0D0D0D" font-weight="700">1</text>
      <rect x="240" y="58" width="60" height="40" rx="4" fill="white"/>
      <text x="246" y="72" font-size="6" fill="#666">Customers</text>
      <text x="246" y="90" font-size="11" fill="#0D0D0D" font-weight="700">10</text>
      <rect x="306" y="58" width="60" height="40" rx="4" fill="white"/>
      <text x="312" y="72" font-size="6" fill="#666">Avg Order</text>
      <text x="312" y="90" font-size="11" fill="#0D0D0D" font-weight="700">₹6,800</text>
      <rect x="108" y="108" width="124" height="124" rx="6" fill="white"/>
      <text x="116" y="124" font-size="8" font-weight="600" fill="#0D0D0D">Recent Orders</text>
      <line x1="116" y1="138" x2="222" y2="138" stroke="#EEE"/>
      <text x="116" y="154" font-size="6" fill="#0D0D0D">Aarav K. — ₹2,500</text>
      <text x="116" y="170" font-size="6" fill="#0D0D0D">Isha V. — ₹8,000</text>
      <text x="116" y="186" font-size="6" fill="#0D0D0D">Rahul B. — ₹4,500</text>
      <rect x="240" y="108" width="126" height="124" rx="6" fill="white"/>
      <text x="248" y="124" font-size="8" font-weight="600" fill="#0D0D0D">Top Artists</text>
      <rect x="248" y="138" width="110" height="4" rx="2" fill="#16A34A"/>
      <rect x="248" y="152" width="84" height="4" rx="2" fill="#16A34A"/>
      <rect x="248" y="166" width="74" height="4" rx="2" fill="#16A34A"/>
      <rect x="248" y="180" width="62" height="4" rx="2" fill="#16A34A"/>
    </svg>`,
  },
];
