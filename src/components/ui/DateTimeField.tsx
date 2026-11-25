"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { MONTHS, WEEKDAY_INITIALS, compareDate, from12h, monthGrid, sameDate, shiftMonth, to12h } from "@/lib/calendar";
import { formatDate } from "@/lib/format";
import { US } from "@/lib/us";
import { fromWall, toWall } from "@/lib/time";
import { useNow } from "@/lib/use-now";
import { Heart } from "../Heart";
import { Button, IconButton } from "./button";
import { fieldShell } from "./Field";
import { Segmented } from "./Segmented";
import { Sheet } from "./Sheet";

/**
 * Picks a day and time (in Philippine time) with our own calendar, instead of
 * the browser's date input. `hint` can describe the choice, like which album
 * it lands in.
 */
export function DateTimeField({
  label,
  hideLabel,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  hideLabel?: boolean;
  value: number;
  onChange: (ms: number) => void;
  hint?: (ms: number) => React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-brown"}>{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-label={`${label}: ${formatDate(value, "long")}, ${formatDate(value, "time")}`}
        onClick={() => setOpen(true)}
        className={`${fieldShell} press gap-2.5 px-3 py-2 text-left text-sm hover:border-tan disabled:pointer-events-none disabled:opacity-60`}
      >
        <CalendarDays aria-hidden="true" className="size-[18px] shrink-0 text-tan" />
        <span className="min-w-0 flex-1 truncate text-cocoa">
          {formatDate(value, "medium")} <span className="text-brown">· {formatDate(value, "time")}</span>
        </span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-brown" />
      </button>
      {open && (
        <PickerSheet
          label={label}
          initial={value}
          hint={hint}
          onCancel={() => setOpen(false)}
          onDone={(ms) => {
            onChange(ms);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function PickerSheet({
  label,
  initial,
  hint,
  onCancel,
  onDone,
}: {
  label: string;
  initial: number;
  hint?: (ms: number) => React.ReactNode;
  onCancel: () => void;
  onDone: (ms: number) => void;
}) {
  const start = toWall(initial);
  const [view, setView] = useState({ year: start.year, month: start.month });
  const [day, setDay] = useState({ year: start.year, month: start.month, day: start.day });
  const [time, setTime] = useState(() => ({ ...to12h(start.hour), minute: start.minute }));
  const now = useNow();
  const today = now === null ? null : toWall(now);

  const draft = fromWall({ ...day, hour: from12h(time.hour, time.pm), minute: time.minute });
  const grid = monthGrid(view.year, view.month);
  const isFuture = (d: { year: number; month: number; day: number }) => today !== null && compareDate(d, today) > 0;
  const canGoForward = today === null || view.year * 12 + view.month < today.year * 12 + today.month;

  const step = (key: "hour" | "minute", delta: number) =>
    setTime((t) =>
      key === "hour"
        ? { ...t, hour: ((t.hour - 1 + delta + 12) % 12) + 1 }
        : // Minutes move in steps of 5; nobody remembers a photo to the minute.
          { ...t, minute: (Math.round(t.minute / 5) * 5 + delta * 5 + 60) % 60 },
    );

  return (
    <Sheet
      open
      onClose={onCancel}
      title={label}
      description={`${formatDate(draft, "long")} · ${formatDate(draft, "time")}`}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-brown">{hint?.(draft)}</p>
          <Button onClick={() => onDone(draft)} data-autofocus>
            Done
          </Button>
        </div>
      }
    >
      {/* Month */}
      <div className="flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="Previous month" size="sm" onClick={() => setView((v) => shiftMonth(v, -1))} />
        <p className="font-display text-xl font-semibold" aria-live="polite">
          {MONTHS[view.month - 1]} {view.year}
        </p>
        <IconButton
          icon={ChevronRight}
          label="Next month"
          size="sm"
          disabled={!canGoForward}
          onClick={() => setView((v) => shiftMonth(v, 1))}
        />
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-tan">
        {WEEKDAY_INITIALS.map((w, i) => (
          <span key={i} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div key={`${view.year}-${view.month}`} role="grid" aria-label={`${MONTHS[view.month - 1]} ${view.year}`} className="fade-in grid grid-cols-7 gap-y-1">
        {grid.map((d) => {
          const selected = sameDate(d, day);
          const isToday = today !== null && sameDate(d, today);
          const monthsary = d.day === US.start.day;
          const future = isFuture(d);
          return (
            <button
              key={`${d.year}-${d.month}-${d.day}`}
              type="button"
              disabled={future}
              onClick={() => {
                setDay({ year: d.year, month: d.month, day: d.day });
                if (!d.inMonth) setView({ year: d.year, month: d.month });
              }}
              aria-pressed={selected}
              aria-label={formatDate(fromWall({ ...d, hour: 12 }), "long")}
              className={`press relative mx-auto grid size-10 place-items-center rounded-full text-sm transition-colors disabled:pointer-events-none disabled:opacity-25 ${
                selected
                  ? "bg-burgundy font-semibold text-cream shadow-md shadow-burgundy/25"
                  : isToday
                    ? "font-semibold text-burgundy ring-1 ring-burgundy/40 hover:bg-wheat"
                    : d.inMonth
                      ? "text-cocoa hover:bg-wheat"
                      : "text-tan hover:bg-wheat/60"
              }`}
            >
              {d.day}
              {monthsary && (
                <Heart className={`absolute bottom-0.5 size-2 ${selected ? "text-cream" : "text-rose/70"}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Time */}
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-wheat/50 p-3">
        <div className="flex items-center gap-1">
          <Stepper label="Hour" value={String(time.hour)} onStep={(dlt) => step("hour", dlt)} />
          <span className="pb-0.5 font-display text-2xl font-semibold text-brown">:</span>
          <Stepper label="Minute" value={String(time.minute).padStart(2, "0")} onStep={(dlt) => step("minute", dlt)} />
        </div>
        <Segmented
          label="AM or PM"
          value={time.pm ? "pm" : "am"}
          onChange={(v) => setTime((t) => ({ ...t, pm: v === "pm" }))}
          options={[
            { value: "am", label: "AM" },
            { value: "pm", label: "PM" },
          ]}
        />
      </div>
    </Sheet>
  );
}

/** A number with minus and plus buttons around it. */
function Stepper({ label, value, onStep }: { label: string; value: string; onStep: (delta: number) => void }) {
  return (
    <div className="flex items-center rounded-full bg-paper shadow-sm" role="group" aria-label={label}>
      <IconButton icon={Minus} label={`${label} down`} size="sm" onClick={() => onStep(-1)} />
      <span aria-live="polite" className="tabular w-8 text-center font-display text-2xl font-semibold text-cocoa">
        {value}
      </span>
      <IconButton icon={Plus} label={`${label} up`} size="sm" onClick={() => onStep(1)} />
    </div>
  );
}
