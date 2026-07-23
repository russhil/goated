"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme";
import {
  canView,
  canViewFinanceTab,
  canManageUsers,
  type Permissions,
} from "@/lib/hq-perms";

export default function HqNav({ perms }: { perms: Permissions }) {
  const pathname = usePathname();

  // Dashboard is always available to a member; the rest are permission-gated.
  const tabs = [
    { href: "/hq", label: "Dashboard", show: true },
    { href: "/hq/clients", label: "Clients", show: canView(perms, "clients") },
    { href: "/hq/prospects", label: "Prospects", show: canView(perms, "prospects") },
    { href: "/hq/content", label: "Content", show: canView(perms, "content") },
    { href: "/hq/finance", label: "Finance", show: canViewFinanceTab(perms) },
    { href: "/hq/users", label: "Users", show: canManageUsers(perms) },
  ].filter((t) => t.show);

  return (
    <div className="flex items-center gap-2 mb-2">
      {tabs.map((t) => {
        const active =
          t.href === "/hq"
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
