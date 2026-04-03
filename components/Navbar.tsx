"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const scrollRef = useRef<HTMLSpanElement>(null);
  const scrollRefMobile = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.body.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
          if (scrollRef.current) scrollRef.current.textContent = `${progress}%`;
          if (scrollRefMobile.current) scrollRefMobile.current.textContent = `${progress}%`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-sm z-[100]" id="navbar">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 h-16 flex items-center justify-between relative">
          {/* Logo */}
          <Link
            href="/"
            className="font-mono text-sm tracking-tight select-none"
          >
            <span className="text-dark">[</span>
            <span className="text-dark font-bold">GOATED</span>
            <span className="text-coral font-bold">.</span>
            <span className="text-dark">]</span>
          </Link>

          {/* Center nav - desktop */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/portfolio"
                  ? pathname === "/portfolio"
                  : false;
              return item.href.startsWith("#") ? (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="px-4 py-1.5 rounded-full text-sm font-sans transition-all duration-300 text-dark/60 hover:text-dark"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-sans transition-all duration-300 ${
                    isActive
                      ? "bg-coral/10 text-coral"
                      : "text-dark/60 hover:text-dark"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right section - desktop */}
          <div className="hidden md:flex items-center gap-6">
            {/* Scroll indicator */}
            <div className="flex items-center gap-2 font-mono text-xs text-muted">
              <span>// scroll to explore</span>
              <span ref={scrollRef} className="text-coral font-medium">0%</span>
            </div>
            
            {/* CTA */}
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("#contact");
              }}
              className="px-5 py-2 bg-dark text-white rounded-full text-sm font-sans font-medium transition-colors hover:bg-coral"
            >
              Let&apos;s Talk
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 w-6"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[5px]" : ""}`} />
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] bg-dark transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[5px]" : ""}`} />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-white z-[99] flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {NAV_ITEMS.map((item) =>
          item.href.startsWith("#") ? (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.href);
              }}
              className="font-serif text-4xl text-dark hover:text-coral transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="font-serif text-4xl text-dark hover:text-coral transition-colors"
            >
              {item.label}
            </Link>
          )
        )}
        <div className="mt-8 font-mono text-xs text-muted">
          // scroll to explore - <span ref={scrollRefMobile} className="text-coral">0%</span>
        </div>
      </div>
    </>
  );
}
