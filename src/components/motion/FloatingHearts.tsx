const HEARTS = [
  { x: 6, size: 18, delay: 0, dur: 13 },
  { x: 18, size: 12, delay: 4, dur: 11 },
  { x: 31, size: 22, delay: 8, dur: 15 },
  { x: 47, size: 10, delay: 2, dur: 10 },
  { x: 62, size: 16, delay: 6, dur: 14 },
  { x: 76, size: 24, delay: 1, dur: 16 },
  { x: 88, size: 12, delay: 9, dur: 12 },
  { x: 95, size: 16, delay: 5, dur: 13 },
];

/** A few hearts drifting up behind the hero. Purely decorative. */
export function FloatingHearts() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {HEARTS.map((h, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="float-up absolute bottom-0"
          style={{
            left: `${h.x}%`,
            width: h.size,
            height: h.size,
            color: i % 3 === 0 ? "var(--color-tan)" : "var(--color-burgundy)",
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.dur}s`,
          }}
        >
          <path
            d="M12 20.5s-7.5-4.6-9.4-9.3C1.3 7.9 3.3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.4 0 5.4 3.4 4.1 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}
