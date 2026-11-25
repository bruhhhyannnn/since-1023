/** Little hearts flying out from the middle. Re-mount (change `key`) to play again. */
export function HeartBurst({ count = 10, color = "#e8768a" }: { count?: number; color?: string }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + (i % 2 ? 0.25 : 0);
        const dist = 26 + (i % 3) * 10;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="burst absolute size-3"
            style={
              {
                color,
                "--tx": `${Math.cos(angle) * dist}px`,
                "--ty": `${Math.sin(angle) * dist}px`,
                animationDelay: `${(i % 3) * 30}ms`,
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
    </span>
  );
}
