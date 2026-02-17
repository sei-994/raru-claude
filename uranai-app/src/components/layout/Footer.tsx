import Link from "next/link";

export default function Footer() {
  return (
    <footer className="hidden border-t border-mystic-700/20 bg-mystic-900/50 py-8 md:block">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-shimmer text-sm font-bold tracking-wider">
            星詠み占い
          </p>
          <nav className="flex gap-6 text-xs text-foreground/50">
            <Link href="/tarot" className="hover:text-gold-400 transition-colors">
              タロット占い
            </Link>
            <Link href="/daily" className="hover:text-gold-400 transition-colors">
              今日の運勢
            </Link>
            <Link href="/numerology" className="hover:text-gold-400 transition-colors">
              数秘術
            </Link>
            <Link href="/compatibility" className="hover:text-gold-400 transition-colors">
              相性診断
            </Link>
            <Link href="/privacy" className="hover:text-gold-400 transition-colors">
              プライバシーポリシー
            </Link>
          </nav>
          <p className="text-xs text-foreground/30">
            &copy; {new Date().getFullYear()} 星詠み占い All rights reserved.
          </p>
          <p className="text-xs text-foreground/30">
            ※占い結果はエンターテインメントとしてお楽しみください。
          </p>
        </div>
      </div>
    </footer>
  );
}
