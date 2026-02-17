"use client";

interface ShareButtonsProps {
  text: string;
  url?: string;
}

export default function ShareButtons({ text, url }: ShareButtonsProps) {
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(shareUrl);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      alert("コピーしました！");
    } catch {
      // fallback
    }
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#1DA1F2]/20 px-4 py-2 text-sm text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/30"
      >
        Xでシェア
      </a>
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#06C755]/20 px-4 py-2 text-sm text-[#06C755] transition-colors hover:bg-[#06C755]/30"
      >
        LINEでシェア
      </a>
      <button
        onClick={handleCopy}
        className="rounded-full bg-foreground/10 px-4 py-2 text-sm text-foreground/70 transition-colors hover:bg-foreground/20"
      >
        URLコピー
      </button>
    </div>
  );
}
