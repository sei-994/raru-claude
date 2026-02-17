export default function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 13) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    duration: `${2 + (i % 5)}s`,
    delay: `${(i * 0.3) % 3}s`,
    opacity: 0.3 + (i % 4) * 0.2,
    size: i % 5 === 0 ? 3 : 2,
  }));

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDuration: star.duration,
            animationDelay: star.delay,
            ["--max-opacity" as string]: star.opacity,
          }}
        />
      ))}
    </div>
  );
}
