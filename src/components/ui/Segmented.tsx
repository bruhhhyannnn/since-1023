import type { ComponentType } from "react";

/** A row of choices with a pill that slides to the selected one. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; icon?: ComponentType<{ className?: string }> }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="relative inline-grid rounded-full border border-wheat-deep bg-paper p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute bottom-1 left-1 top-1 rounded-full bg-burgundy shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.3,1.2,0.5,1)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map(({ value: v, label: l, icon: Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={`relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-300 ${
            v === value ? "text-cream" : "text-brown hover:text-burgundy"
          }`}
        >
          {Icon && <Icon className="size-4" />}
          {l}
        </button>
      ))}
    </div>
  );
}
