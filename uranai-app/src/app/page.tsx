import Link from "next/link";

const features = [
  {
    href: "/tarot",
    icon: "🃏",
    title: "タロット占い",
    description: "大アルカナ22枚から3枚を選んで、過去・現在・未来を読み解きます",
    cta: "カードを引く",
  },
  {
    href: "/daily",
    icon: "⭐",
    title: "今日の運勢",
    description: "12星座ごとに毎日更新。総合運・恋愛運・金運をチェック",
    cta: "運勢を見る",
  },
  {
    href: "/numerology",
    icon: "🔢",
    title: "数秘術",
    description: "生年月日からライフパスナンバーを算出し、あなたの本質に迫ります",
    cta: "診断する",
  },
  {
    href: "/compatibility",
    icon: "💕",
    title: "相性診断",
    description: "ふたりの生年月日から数秘術ベースの相性を徹底分析",
    cta: "診断する",
  },
];

export default function HomePage() {
  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-20 text-center md:py-32">
        <div className="animate-float mb-6 text-6xl">✦</div>
        <h1 className="text-shimmer mb-4 text-3xl font-bold tracking-wider md:text-4xl">
          星詠み占い
        </h1>
        <p className="mb-2 text-sm text-foreground/60 md:text-base">
          あなたの運命を、星が導く
        </p>
        <p className="mb-8 text-xs text-foreground/40">
          完全無料 ── タロット・星座占い・数秘術・相性診断
        </p>
        <Link
          href="/tarot"
          className="glow-gold rounded-full bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-3 text-sm font-bold text-mystic-900 transition-all hover:scale-105 hover:shadow-lg"
        >
          無料で占いを始める
        </Link>
      </section>

      {/* Divider */}
      <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      {/* Features */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl border border-mystic-700/30 bg-surface/50 p-6 backdrop-blur-sm transition-all hover:border-gold-500/30 hover:bg-surface-light/50"
            >
              <span className="mb-3 block text-3xl">{f.icon}</span>
              <h2 className="mb-2 text-base font-bold text-foreground transition-colors group-hover:text-gold-400">
                {f.title}
              </h2>
              <p className="mb-4 text-xs leading-relaxed text-foreground/50">
                {f.description}
              </p>
              <span className="text-xs font-bold text-gold-500/70 transition-colors group-hover:text-gold-400">
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto h-px w-48 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

      {/* About */}
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <h2 className="mb-4 text-lg font-bold text-gold-400">星詠み占いについて</h2>
        <p className="text-sm leading-relaxed text-foreground/60">
          タロットカード、西洋占星術、数秘術を組み合わせた本格占いサイトです。
          すべての占いを完全無料でお楽しみいただけます。
          毎日の運勢チェックから、深い自己理解、大切な人との相性診断まで──
          星の導きがあなたの日々に小さな光を灯します。
        </p>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 text-center">
        <Link
          href="/tarot"
          className="inline-block rounded-full border border-gold-500/30 px-6 py-2.5 text-sm text-gold-400 transition-all hover:bg-gold-500/10"
        >
          今すぐ占ってみる ✦
        </Link>
      </section>
    </div>
  );
}
