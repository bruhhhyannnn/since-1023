/** An on/off toggle (instead of a browser checkbox). */
export function Switch({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`group inline-flex items-center gap-2.5 rounded-full text-left text-sm text-brown ${className}`}
    >
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-burgundy" : "bg-wheat-deep group-hover:bg-tan/70"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] ${
            checked ? "translate-x-4" : ""
          }`}
        />
      </span>
      {label}
    </button>
  );
}
