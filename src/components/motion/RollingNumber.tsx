/** Digits that roll into place when they change, like a flip clock. */
export function RollingNumber({ value, className = "" }: { value: string; className?: string }) {
  const chars = [...value];
  return (
    <span className={`inline-flex overflow-hidden ${className}`} aria-label={value}>
      {chars.map((ch, i) => {
        // Keyed by position from the right, so changing digits re-mount (and animate) in place.
        const pos = chars.length - i;
        return /\d/.test(ch) ? (
          <span key={`${pos}-${ch}`} aria-hidden="true" className="roll-in inline-block">
            {ch}
          </span>
        ) : (
          <span key={`${pos}-sep`} aria-hidden="true" className="inline-block">
            {ch}
          </span>
        );
      })}
    </span>
  );
}
