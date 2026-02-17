"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/tarot", label: "タロット", icon: "🃏" },
  { href: "/daily", label: "今日の運勢", icon: "⭐" },
  { href: "/numerology", label: "数秘術", icon: "🔢" },
  { href: "/compatibility", label: "相性", icon: "💕" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="pb-safe fixed bottom-0 left-0 right-0 z-50 border-t border-mystic-700/30 bg-mystic-900/95 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive
                  ? "text-gold-400"
                  : "text-foreground/50 hover:text-foreground/70"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
