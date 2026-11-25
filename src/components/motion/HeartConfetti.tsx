const COLORS = ["#7a1f2e", "#a33a4c", "#e8768a", "#c9a47a", "#e5cd9f"];

/** Hearts raining down once, for monthsary days. */
export function HeartConfetti({ count = 36 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        // Spread pseudo-randomly but the same on every render.
        const x = (i * 37) % 100;
        const size = 10 + ((i * 7) % 14);
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="confetti absolute -top-8"
            style={
              {
                left: `${x}%`,
                width: size,
                height: size,
                color: COLORS[i % COLORS.length],
                animationDelay: `${(i % 12) * 120}ms`,
                animationDuration: `${2600 + ((i * 53) % 1600)}ms`,
                "--spin": `${((i * 47) % 2 ? 1 : -1) * (180 + ((i * 29) % 300))}deg`,
                "--sway": `${((i * 13) % 60) - 30}px`,
              } as React.CSSProperties
            }
          >
            <path
              d="M12 20.5s-7.5-4.6-9.4-9.3C1.3 7.9 3.3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.4 0 5.4 3.4 4.1 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"
              fill="currentColor"
            />
          </svg>
        );
      })}
    </div>
  );
}
