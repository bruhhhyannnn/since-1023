"use client";

import { useId, type ComponentProps, type ComponentType } from "react";

/* Text inputs that match the site: a soft field, an optional icon, and a burgundy glow when focused. */

export const fieldShell =
  "flex w-full min-w-0 items-center rounded-xl border border-wheat-deep bg-cream transition-[border-color,box-shadow] focus-within:border-burgundy focus-within:ring-4 focus-within:ring-burgundy/10";

export function TextField({
  label,
  hideLabel,
  icon: Icon,
  trailing,
  hint,
  error,
  className = "",
  id,
  ...props
}: {
  label: string;
  hideLabel?: boolean;
  icon?: ComponentType<{ className?: string }>;
  trailing?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
} & ComponentProps<"input">) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={`block text-left ${className}`}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-brown"}>
        {label}
      </label>
      <span className={`${fieldShell} ${error ? "border-rose" : ""} ${props.disabled ? "opacity-60" : ""}`}>
        {Icon && <Icon aria-hidden="true" className="ml-3.5 size-[18px] shrink-0 text-tan" />}
        <input
          id={inputId}
          className="h-11 w-full min-w-0 bg-transparent px-3.5 text-[15px] text-cocoa outline-none placeholder:text-tan disabled:cursor-not-allowed"
          {...props}
        />
        {trailing}
      </span>
      {error ? (
        <span role="alert" className="mt-1.5 block text-sm text-rose">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-brown">{hint}</span>
      )}
    </div>
  );
}
