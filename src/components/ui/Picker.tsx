"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fieldShell } from "./Field";
import { Sheet } from "./Sheet";

export type PickerOption<T extends string | number> = {
  value: T;
  label: string;
  description?: string;
  /** A little note on the right, like "12 photos". */
  meta?: string;
};

/** A dropdown that opens our own list (instead of the browser's select menu). */
export function Picker<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: PickerOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-brown">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`${fieldShell} press gap-3 px-3.5 py-2.5 text-left hover:border-tan`}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-cocoa">{current?.label ?? "Choose…"}</span>
          {(current?.description || current?.meta) && (
            <span className="block truncate text-xs text-brown">
              {[current.description, current.meta].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-brown transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <OptionList
          options={options}
          value={value}
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      </Sheet>
    </div>
  );
}

function OptionList<T extends string | number>({
  options,
  value,
  onPick,
}: {
  options: PickerOption<T>[];
  value: T;
  onPick: (value: T) => void;
}) {
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "center" });
    list.current?.focus({ preventScroll: true });
    // Only when the list first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ul
      ref={list}
      role="listbox"
      tabIndex={0}
      data-autofocus
      aria-activedescendant={`option-${active}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, options.length - 1));
        else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
        else if (e.key === "Home") setActive(0);
        else if (e.key === "End") setActive(options.length - 1);
        else if (e.key === "Enter" || e.key === " ") onPick(options[active].value);
        else return;
        e.preventDefault();
      }}
      className="-mx-2 space-y-0.5 outline-none"
    >
      {options.map((o, i) => {
        const selected = o.value === value;
        return (
          <li
            key={String(o.value)}
            id={`option-${i}`}
            data-index={i}
            role="option"
            aria-selected={selected}
            onClick={() => onPick(o.value)}
            onMouseMove={() => setActive(i)}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
              i === active ? "bg-wheat/70" : ""
            } ${selected ? "text-burgundy" : "text-cocoa"}`}
          >
            <span className="min-w-0 flex-1">
              <span className={`block truncate ${selected ? "font-semibold" : "font-medium"}`}>{o.label}</span>
              {o.description && <span className="block truncate text-xs text-brown">{o.description}</span>}
            </span>
            {o.meta && <span className="shrink-0 text-xs text-brown">{o.meta}</span>}
            <Check aria-hidden="true" className={`size-[18px] shrink-0 ${selected ? "pop-in" : "invisible"}`} />
          </li>
        );
      })}
    </ul>
  );
}
