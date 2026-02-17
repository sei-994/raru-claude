"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/tarot", label: "タロット占い" },
  { href: "/daily", label: "今日の運勢" },
  { href: "/numerology", label: "数秘術" },
  { href: "/compatibility", label: "相性診断" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-mystic-700/30 bg-mystic-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-shimmer text-lg font-bold tracking-wider">
          星詠み占い
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-gold-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="メニュー"
        >
          <span
            className={`h-0.5 w-5 bg-foreground/70 transition-transform ${isOpen ? "translate-y-1.5 rotate-45" : ""}`}
          />
          <span
            className={`h-0.5 w-5 bg-foreground/70 transition-opacity ${isOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-0.5 w-5 bg-foreground/70 transition-transform ${isOpen ? "-translate-y-1.5 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <nav className="border-t border-mystic-700/30 bg-mystic-900/95 backdrop-blur-md md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-6 py-3 text-sm text-foreground/70 transition-colors hover:bg-mystic-800/50 hover:text-gold-400"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
