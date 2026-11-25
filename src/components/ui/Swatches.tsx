import { Check } from "lucide-react";

/** Pick-a-color circles (instead of radio buttons). */
export function Swatches<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; color: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            onClick={() => onChange(o.value)}
            className={`press grid size-8 place-items-center rounded-full border shadow-sm transition-transform ${
              on ? "scale-110 border-burgundy ring-2 ring-burgundy/25" : "border-wheat-deep hover:scale-105"
            }`}
            style={{ background: o.color }}
          >
            {on && <Check aria-hidden="true" className={`pop-in size-4 ${o.value === "burgundy" ? "text-cream" : "text-burgundy"}`} strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
