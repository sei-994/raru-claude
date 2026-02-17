import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import StarField from "@/components/shared/StarField";

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "星詠み占い | 無料タロット・今日の運勢・数秘術",
    template: "%s | 星詠み占い",
  },
  description:
    "完全無料の本格占いサイト。タロット占い、今日の運勢、数秘術、相性診断であなたの運命を読み解きます。",
  keywords: [
    "占い",
    "無料",
    "タロット占い",
    "今日の運勢",
    "数秘術",
    "相性診断",
    "星座占い",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "星詠み占い",
    title: "星詠み占い | 無料タロット・今日の運勢・数秘術",
    description:
      "完全無料の本格占いサイト。タロット占い、今日の運勢、数秘術、相性診断であなたの運命を読み解きます。",
  },
  twitter: {
    card: "summary_large_image",
    title: "星詠み占い | 無料タロット・今日の運勢・数秘術",
    description: "完全無料の本格占いサイト。あなたの運命を星が導きます。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSerifJp.variable} antialiased`}>
        <StarField />
        <div className="relative z-10 flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
