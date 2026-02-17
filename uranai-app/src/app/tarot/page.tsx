import type { Metadata } from "next";
import TarotDeck from "@/components/tarot/TarotDeck";

export const metadata: Metadata = {
  title: "タロット占い | 無料で本格三枚引き",
  description:
    "大アルカナ22枚から3枚を選んで、過去・現在・未来を占います。完全無料の本格タロット占い。",
};

export default function TarotPage() {
  return (
    <div className="pt-20 pb-24">
      {/* Hero */}
      <div className="mb-10 text-center">
        <span className="mb-2 inline-block text-4xl">🃏</span>
        <h1 className="text-shimmer mb-2 text-2xl font-bold">タロット占い</h1>
        <p className="text-sm text-foreground/50">
          大アルカナ22枚 ── 三枚引きスプレッド
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
      </div>

      <TarotDeck />
    </div>
  );
}
