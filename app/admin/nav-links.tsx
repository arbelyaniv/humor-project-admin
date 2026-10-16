"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/generations", label: "Generations", icon: "✎" },
  { href: "/admin/votes", label: "Votes", icon: "⇅" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {links.map(({ href, label, icon }) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
              active
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <span aria-hidden className="w-4 text-center">
              {icon}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
