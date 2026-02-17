interface AdBannerProps {
  slot?: string;
  className?: string;
}

export default function AdBanner({ slot = "auto", className = "" }: AdBannerProps) {
  return (
    <div
      className={`flex min-h-[90px] items-center justify-center rounded-lg border border-mystic-700/20 bg-mystic-900/30 text-xs text-foreground/20 ${className}`}
      data-ad-slot={slot}
    >
      {/* Google AdSense will be inserted here */}
      <span className="select-none">AD</span>
    </div>
  );
}
