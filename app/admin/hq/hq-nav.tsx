"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme";

const TABS = [
  { href: "/admin/hq", label: "Dashboard" },
  { href: "/admin/hq/clients", label: "Clients" },
  { href: "/admin/hq/prospects", label: "Prospects" },
  { href: "/admin/hq/finance", label: "Finance" },
];

export default function HqNav() {
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-2 mb-2">
      {TABS.map((t) => {
        const active =
          t.href === "/admin/hq"
            ? pathname === t.href
            : pathname.startsWith(t.href);
        return (
          <a
            key={t.href}
            href={t.href}
            className={`px-4 py-2 rounded-full text-sm font-sans transition ${
              active
                ? "bg-dark text-white"
                : "bg-dark/[0.04] text-dark/70 hover:bg-dark/10"
            }`}
          >
            {t.label}
          </a>
        );
      })}
      <ThemeToggle />
    </div>
  );
}
