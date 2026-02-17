import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-24">
      <h1 className="mb-8 text-center text-xl font-bold text-gold-400">
        プライバシーポリシー
      </h1>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/70">
        <section>
          <h2 className="mb-2 font-bold text-foreground/90">1. 個人情報の取り扱いについて</h2>
          <p>
            当サイト「星詠み占い」（以下、当サイト）は、ユーザーのプライバシーを尊重し、
            個人情報の保護に努めます。当サイトでは、占いの利用にあたって
            個人情報の入力を求めることはありません。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">2. 取得する情報</h2>
          <p>
            当サイトでは、占いの結果を生成するために生年月日等の情報をご入力いただく場合がありますが、
            これらの情報はブラウザ上でのみ処理され、外部サーバーに送信・保存されることはありません。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">3. Cookieについて</h2>
          <p>
            当サイトでは、ユーザー体験の向上のためにCookieを使用する場合があります。
            また、広告配信サービス（Google AdSense等）がCookieを使用して
            ユーザーの興味に基づいた広告を配信する場合があります。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">4. 広告について</h2>
          <p>
            当サイトでは、第三者配信の広告サービス（Google AdSense等）を利用する場合があります。
            広告配信事業者は、ユーザーの興味に応じた広告を表示するために
            Cookie等の技術を使用することがあります。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">5. アクセス解析について</h2>
          <p>
            当サイトでは、サービス向上のためにアクセス解析ツールを使用する場合があります。
            これらのツールは、トラフィックデータの収集にCookieを使用しています。
            このデータは匿名で収集されており、個人を特定するものではありません。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">6. 免責事項</h2>
          <p>
            当サイトの占い結果はエンターテインメントを目的としたものであり、
            その正確性や信頼性を保証するものではありません。
            占い結果に基づく行動・判断はご自身の責任で行ってください。
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-bold text-foreground/90">7. プライバシーポリシーの変更</h2>
          <p>
            当サイトは、必要に応じて本ポリシーを変更することがあります。
            変更後のプライバシーポリシーは、当ページに掲載した時点から効力を生じるものとします。
          </p>
        </section>

        <p className="pt-4 text-xs text-foreground/40">
          制定日: 2026年2月17日
        </p>
      </div>
    </div>
  );
}
