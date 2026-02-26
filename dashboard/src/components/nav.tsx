"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Overview", icon: "◈" },
  { href: "/watchlist", label: "Watchlist", icon: "◉" },
  { href: "/trades", label: "Trade Ideas", icon: "◆" },
  { href: "/drafts", label: "Drafts", icon: "✎" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-border px-4 h-12 flex items-center justify-between">
        <span className="font-mono text-sm font-bold tracking-wider text-accent">CLAW CAPITAL</span>
        <button onClick={() => setOpen(!open)} className="text-xl p-1">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur pt-12">
          <nav className="p-4 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded text-sm font-medium ${
                  isActive(l.href) ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="mr-2">{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-56 bg-card border-r border-border z-40">
        <div className="p-4 border-b border-border">
          <span className="font-mono text-sm font-bold tracking-wider text-accent">CLAW CAPITAL</span>
          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">TRADING TERMINAL</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                isActive(l.href)
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span className="text-xs">{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border text-[10px] text-muted-foreground font-mono">
          v0.2 — simplified
        </div>
      </aside>

      <div className="lg:hidden h-12" />
    </>
  );
}
