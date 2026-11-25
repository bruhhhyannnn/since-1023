"use client";

import { Pause, Quote, RotateCcw, Share, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { albumOf } from "@/lib/albums";
import { canvasToJpeg, loadImage, loadPostFonts, shareOrDownload } from "@/lib/collage";
import { formatDate, formatRange, num } from "@/lib/format";
import type { Photo } from "@/lib/photos";
import { DAY, START, monthsaryTitle, nextAnniversary, nextMonthsary } from "@/lib/time";
import { COUPLE } from "@/lib/us";
import { CARD, renderWrappedCard } from "@/lib/wrapped-card";
import { TIMES, WEEKDAYS, montage, type Wrap } from "@/lib/wrapped";
import { Heart } from "./Heart";

/*
 * Our own "Wrapped": a tap-through story of a monthsary (or a whole year),
 * built from the photos and the dates.
 */

type Theme = { bg: string; fg: string; accent: string; soft: string };

const T = {
  burgundy: { bg: "#7a1f2e", fg: "#fbf6ec", accent: "#e5cd9f", soft: "rgba(243,228,196,0.13)" },
  wheat: { bg: "#f3e4c4", fg: "#5b1522", accent: "#a33a4c", soft: "rgba(122,31,46,0.10)" },
  cocoa: { bg: "#3d2b22", fg: "#fbf6ec", accent: "#e0b98a", soft: "rgba(243,228,196,0.10)" },
  rose: { bg: "#a33a4c", fg: "#fff7ee", accent: "#f3e4c4", soft: "rgba(255,247,238,0.14)" },
  tan: { bg: "#c9a47a", fg: "#2e1f18", accent: "#7a1f2e", soft: "rgba(61,43,34,0.12)" },
  cream: { bg: "#fbf6ec", fg: "#7a1f2e", accent: "#c9a47a", soft: "rgba(122,31,46,0.08)" },
  deep: { bg: "#5b1522", fg: "#fbf6ec", accent: "#e5cd9f", soft: "rgba(243,228,196,0.12)" },
  night: { bg: "#120c0a", fg: "#fbf6ec", accent: "#e8768a", soft: "rgba(255,255,255,0.06)" },
} satisfies Record<string, Theme>;

type Ctx = { paused: boolean; restart: () => void; close: () => void };
type Slide = { key: string; theme: Theme; ms: number; render: (ctx: Ctx) => React.ReactNode };

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export function Wrapped({
  wrap,
  now,
  complete,
  onClose,
}: {
  wrap: Wrap;
  now: number;
  complete: boolean;
  onClose: () => void;
}) {
  const slides = useMemo(() => buildSlides(wrap, now, complete), [wrap, now, complete]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [run, setRun] = useState(0);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; held: boolean } | null>(null);
  const slide = slides[index];

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);
  const restart = useCallback(() => {
    setIndex(0);
    setRun((r) => r + 1);
  }, []);

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, next, prev]);

  // Warm up the images the story will need.
  useEffect(() => {
    for (const p of wrap.photos.slice(0, 40)) new Image().src = p.thumbUrl;
    for (const p of [wrap.cover, ...wrap.favorites.slice(0, 3), ...(wrap.busiest?.photos.slice(0, 3) ?? [])]) {
      if (p) new Image().src = p.url;
    }
  }, [wrap]);

  // Tap the left third to go back, anywhere else to go on; press and hold to pause.
  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, a")) return;
    const h = {
      held: false,
      timer: setTimeout(() => {
        h.held = true;
        setPaused(true);
      }, 220),
    };
    hold.current = h;
  }
  function onPointerUp(e: React.PointerEvent) {
    const h = hold.current;
    hold.current = null;
    if (!h) return;
    clearTimeout(h.timer);
    if (h.held) return setPaused(false);
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width * 0.3) prev();
    else next();
  }
  function onPointerCancel() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
    setPaused(false);
  }

  const theme = slide.theme;
  const vars = {
    background: theme.bg,
    color: theme.fg,
    "--fg": theme.fg,
    "--accent": theme.accent,
    "--soft": theme.soft,
  } as React.CSSProperties;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${wrap.title} Wrapped`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="@container relative h-dvh w-full touch-none select-none overflow-hidden transition-colors duration-700 sm:aspect-[9/16] sm:h-[min(92dvh,880px)] sm:w-auto sm:rounded-[28px] sm:shadow-2xl"
        style={vars}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => hold.current && onPointerCancel()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Shapes key={`shapes-${run}-${index}`} variant={index} />

        <div key={`${run}-${slide.key}`} className="absolute inset-0">
          {slide.render({ paused, restart, close: onClose })}
        </div>

        {/* Progress */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-3 pt-3">
          {slides.map((s, i) => (
            <div key={s.key} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: `color-mix(in srgb, ${theme.fg} 28%, transparent)` }}>
              <div
                key={i === index ? `run-${run}-${index}` : "still"}
                className={`h-full ${i < index || (i === index && !Number.isFinite(s.ms)) ? "w-full" : i === index ? "progress" : "w-0"}`}
                style={{
                  background: theme.fg,
                  animationDuration: Number.isFinite(s.ms) ? `${s.ms}ms` : undefined,
                  animationPlayState: paused ? "paused" : "running",
                }}
                onAnimationEnd={i === index ? (e) => e.animationName === "progress" && next() : undefined}
              />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 top-5 z-10 flex items-center justify-between px-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
            <Heart className="size-3" /> {COUPLE}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="press -mr-2 grid size-10 place-items-center rounded-full opacity-80 transition-opacity hover:opacity-100"
          >
            <X aria-hidden="true" className="size-6" />
          </button>
        </div>

        {paused && Number.isFinite(slide.ms) && (
          <p className="fade-in absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-4 py-1.5 text-xs text-white backdrop-blur">
            <Pause aria-hidden="true" className="size-3.5" />
            Paused
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function buildSlides(wrap: Wrap, now: number, complete: boolean): Slide[] {
  const month = wrap.kind === "month";
  const period = month ? "month" : "year";
  const reel = montage(wrap.photos);
  const slides: Slide[] = [];
  const add = (key: string, theme: Theme, ms: number, render: Slide["render"]) => slides.push({ key, theme, ms, render });

  add("intro", T.burgundy, 4800, () => (
    <Center>
      <p className="rise text-[3.4cqw] font-semibold uppercase tracking-[0.35em] opacity-80" style={delay(150)}>
        since {formatDate(START, "dots")}
      </p>
      <h2 className="zoom-in mt-[4cqw] font-display text-[17cqw] font-semibold italic leading-[0.88]" style={delay(350)}>
        {wrap.title}
      </h2>
      <p className="rise mt-[5cqw] text-[7cqw] font-extrabold uppercase tracking-[0.3em] text-[var(--accent)]" style={delay(1100)}>
        Wrapped
      </p>
      <p className="rise mt-[3cqw] text-[3.8cqw] opacity-80" style={delay(1600)}>
        {formatRange(wrap.from + DAY / 2, wrap.to)}
        {!complete && " · so far"}
      </p>
    </Center>
  ));

  const sinceStart = Math.floor((Math.min(now, wrap.to + 1) - START) / DAY);
  add("time", T.wheat, 7000, () => (
    <Center>
      <p className="rise font-display text-[8cqw] italic" style={delay(100)}>
        This {period} {complete ? "was" : "is"}
      </p>
      <p className="zoom-in mt-[2cqw] text-[30cqw] font-extrabold leading-none tracking-tight text-[var(--accent)]" style={delay(350)}>
        <CountUp value={wrap.periodDays} delay={350} />
      </p>
      <p className="rise font-display text-[8cqw] italic" style={delay(700)}>
        days long
      </p>
      <p className="rise mt-[8cqw] text-[5cqw] leading-snug" style={delay(1800)}>
        that&apos;s{" "}
        <b className="font-extrabold">
          <CountUp value={wrap.periodDays * 1440} delay={1900} />
        </b>{" "}
        minutes of us
      </p>
      <p className="rise mt-[4cqw] text-[3.8cqw] opacity-70" style={delay(3200)}>
        and {num(sinceStart)} days since the very first one
      </p>
    </Center>
  ));

  add("moments", T.cocoa, 6000, () => (
    <>
      <PhotoWall photos={wrap.photos} />
      <Center>
        <p className="rise font-display text-[8cqw] italic" style={delay(100)}>
          We kept
        </p>
        <p className="zoom-in text-[34cqw] font-extrabold leading-none tracking-tight text-[var(--accent)]" style={delay(300)}>
          <CountUp value={wrap.photos.length} delay={300} ms={1100} />
        </p>
        <p className="rise font-display text-[8cqw] italic" style={delay(600)}>
          {wrap.photos.length === 1 ? "moment" : "moments"} this {period}
        </p>
        <p className="rise mt-[6cqw] text-[4.4cqw] opacity-85" style={delay(1700)}>
          across {wrap.days} different {wrap.days === 1 ? "day" : "days"}
        </p>
      </Center>
    </>
  ));

  if (wrap.busiest) {
    const b = wrap.busiest;
    add("busiest", T.rose, 7000, () => (
      <div className="flex h-full flex-col px-[8cqw] pb-[10cqw] pt-[22cqw]">
        <p className="rise text-[3.6cqw] font-semibold uppercase tracking-[0.25em] opacity-85" style={delay(100)}>
          Our most photographed day
        </p>
        <h2 className="rise mt-[3cqw] font-display text-[11cqw] font-semibold italic leading-[0.95]" style={delay(300)}>
          {formatDate(b.day, wrap.kind === "year" ? "dayShortYear" : "dayShort")}
        </h2>
        <div className="relative mt-[6cqw] flex-1">
          {b.photos.slice(0, 3).map((p, i) => (
            <Polaroid
              key={p.id}
              photo={p}
              rotate={[-7, 5, -2][i]}
              delayMs={900 + i * 350}
              className="absolute w-[50cqw]"
              style={{ left: `${[2, 32, 16][i]}cqw`, top: `${[0, 8, 26][i]}cqw` }}
            />
          ))}
        </div>
        <p className="rise text-[4.6cqw] leading-snug" style={delay(2300)}>
          <b className="font-extrabold">{b.photos.length} photos</b> in one day. Must&apos;ve been a good one.
        </p>
      </div>
    ));
  }

  if (wrap.topTime) {
    const label = TIMES.find((t) => t.key === wrap.topTime)!.label.toLowerCase();
    add("time-of-day", T.tan, 7000, () => (
      <div className="flex h-full flex-col justify-center px-[8cqw]">
        <p className="rise font-display text-[8cqw] italic leading-tight" style={delay(100)}>
          We&apos;re at our best in the
        </p>
        <p className="zoom-in mt-[1cqw] text-[19cqw] font-extrabold leading-none tracking-tight text-[var(--accent)]" style={delay(400)}>
          {label}
        </p>
        <ul className="mt-[10cqw] space-y-[3.5cqw]">
          {wrap.timeOfDay.map((t, i) => (
            <li key={t.key} className="rise" style={delay(1200 + i * 150)}>
              <div className="flex justify-between text-[3.8cqw] font-semibold">
                <span>{t.label}</span>
                <span>{Math.round(t.share * 100)}%</span>
              </div>
              <div className="mt-[1.2cqw] h-[2.6cqw] overflow-hidden rounded-full" style={{ background: "var(--soft)" }}>
                <div
                  className="grow-x h-full rounded-full"
                  style={{
                    width: `${Math.max(t.share * 100, 2)}%`,
                    background: t.key === wrap.topTime ? "var(--accent)" : "var(--fg)",
                    opacity: t.key === wrap.topTime ? 1 : 0.45,
                    ...delay(1400 + i * 150),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    ));
  }

  if (wrap.topWeekday !== null) {
    const top = wrap.topWeekday;
    const max = Math.max(...wrap.weekdays, 1);
    add("weekday", T.cream, 6000, () => (
      <div className="flex h-full flex-col justify-center px-[8cqw]">
        <p className="zoom-in text-[17cqw] font-extrabold leading-none tracking-tight" style={delay(200)}>
          {WEEKDAYS[top]}s
        </p>
        <p className="rise mt-[2cqw] font-display text-[9cqw] italic" style={delay(700)}>
          were our day
        </p>
        <div className="mt-[12cqw] flex h-[42cqw] items-end justify-between gap-[2cqw]">
          {wrap.weekdays.map((count, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-[2cqw]">
              <div
                className="grow-y w-full rounded-t-[2cqw]"
                style={{
                  height: `${Math.max((count / max) * 100, 4)}%`,
                  background: i === top ? "var(--fg)" : "var(--accent)",
                  opacity: i === top ? 1 : 0.5,
                  ...delay(1200 + i * 90),
                }}
              />
              <span className={`text-[3.6cqw] ${i === top ? "font-extrabold" : "opacity-70"}`}>{WEEKDAYS[i][0]}</span>
            </div>
          ))}
        </div>
      </div>
    ));
  }

  if (wrap.topAlbum) {
    const a = wrap.topAlbum;
    const inAlbum = wrap.photos.filter((p) => albumOf(p) === a.n);
    const cover = inAlbum.find((p) => p.favorite) ?? inAlbum[0];
    add("top-album", T.rose, 6500, () => (
      <div className="flex h-full flex-col justify-center px-[8cqw]">
        <p className="rise text-[3.6cqw] font-semibold uppercase tracking-[0.25em] opacity-85" style={delay(100)}>
          Our biggest month
        </p>
        <h2 className="zoom-in mt-[3cqw] font-display text-[13cqw] font-semibold italic leading-[0.95]" style={delay(300)}>
          {monthsaryTitle(a.n)}
        </h2>
        {cover && <Polaroid photo={cover} rotate={-4} delayMs={900} className="mx-auto mt-[8cqw] w-[62cqw]" />}
        <p className="rise mt-[8cqw] text-[5cqw]" style={delay(1800)}>
          <b className="font-extrabold">{a.count} photos</b> in one monthsary
        </p>
      </div>
    ));
  }

  if (wrap.favorites.length > 0) {
    const favs = wrap.favorites.slice(0, 3);
    add("favorites", T.deep, 7000, () => (
      <div className="flex h-full flex-col px-[8cqw] pb-[12cqw] pt-[22cqw]">
        <p className="rise text-[3.6cqw] font-semibold uppercase tracking-[0.25em] opacity-85" style={delay(100)}>
          The ones we loved most
        </p>
        <h2 className="rise mt-[2cqw] font-display text-[12cqw] font-semibold italic leading-none" style={delay(300)}>
          Our favorite{favs.length === 1 ? "" : "s"}
        </h2>
        <div className="relative mt-[8cqw] flex-1">
          {favs.length === 1 ? (
            <Polaroid photo={favs[0]} rotate={-3} delayMs={800} className="mx-auto w-[70cqw]" caption />
          ) : (
            favs.map((p, i) => (
              <Polaroid
                key={p.id}
                photo={p}
                rotate={[-6, 6, -1][i]}
                delayMs={800 + i * 400}
                caption
                className="absolute w-[46cqw]"
                style={{ left: `${[0, 38, 18][i]}cqw`, top: `${[0, 10, 42][i]}cqw` }}
              />
            ))
          )}
        </div>
      </div>
    ));
  }

  if (wrap.captions.length > 0) {
    const quote = [...wrap.captions].filter((c) => c.text.length <= 160).sort((a, b) => b.text.length - a.text.length)[0] ?? wrap.captions[0];
    add("quote", T.wheat, 6500, () => (
      <Center>
        <p className="rise text-[3.6cqw] font-semibold uppercase tracking-[0.25em] opacity-80" style={delay(100)}>
          In our own words
        </p>
        <Quote aria-hidden="true" className="zoom-in mt-[5cqw] size-[16cqw] fill-current text-[var(--accent)]" strokeWidth={0} style={delay(300)} />
        <p className="rise mt-[2cqw] font-display text-[9cqw] font-medium italic leading-[1.1]" style={delay(700)}>
          {quote.text}
        </p>
        <p className="rise mt-[6cqw] text-[3.8cqw] opacity-75" style={delay(1500)}>
          {formatDate(quote.at, "long")}
        </p>
      </Center>
    ));
  }

  if (reel.length > 0) {
    const ms = Math.min(Math.max(reel.length * 1300 + 800, 4500), 18000);
    add("montage", T.night, ms, ({ paused }) => <Montage photos={reel} paused={paused} />);
  }

  const upcoming = month ? nextMonthsary(now) : { n: nextAnniversary(now).years * 12, at: nextAnniversary(now).at };
  const daysToGo = Math.max(0, Math.ceil((upcoming.at - now) / DAY));
  add("next", T.burgundy, 6000, () => (
    <Center>
      <p className="rise text-[3.6cqw] font-semibold uppercase tracking-[0.25em] opacity-85" style={delay(100)}>
        Next up
      </p>
      <h2 className="zoom-in mt-[3cqw] font-display text-[15cqw] font-semibold italic leading-[0.92]" style={delay(300)}>
        Our {monthsaryTitle(upcoming.n)}
      </h2>
      <p className="rise mt-[4cqw] text-[4.2cqw] opacity-85" style={delay(900)}>
        {formatDate(upcoming.at, "long")} · 7:00 PM
      </p>
      <p className="rise mt-[10cqw] text-[22cqw] font-extrabold leading-none tracking-tight text-[var(--accent)]" style={delay(1400)}>
        <CountUp value={daysToGo} delay={1400} ms={1000} />
      </p>
      <p className="rise font-display text-[7cqw] italic" style={delay(1600)}>
        {daysToGo === 1 ? "day to go" : "days to go"}
      </p>
    </Center>
  ));

  add("summary", T.cocoa, Infinity, ({ restart, close }) => <Summary wrap={wrap} restart={restart} close={close} />);
  return slides;
}

/* ------------------------------------------------------------------------ */

function Center({ children }: { children: React.ReactNode }) {
  return <div className="relative flex h-full flex-col items-center justify-center px-[8cqw] text-center">{children}</div>;
}

function CountUp({ value, delay: wait = 300, ms = 1400 }: { value: number; delay?: number; ms?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now() + (reduce ? 0 : wait);
    let raf = 0;
    const tick = (t: number) => {
      const p = reduce ? 1 : Math.min(1, Math.max(0, (t - start) / ms));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, wait, ms]);
  return <span className="tabular">{num(shown)}</span>;
}

function Polaroid({
  photo,
  rotate,
  delayMs,
  caption,
  className = "",
  style,
}: {
  photo: Photo;
  rotate: number;
  delayMs: number;
  caption?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const label = photo.caption?.trim() || formatDate(Date.parse(photo.takenAt), "short");
  return (
    <figure
      className={`drop rounded-[1cqw] bg-[#fffcf6] p-[2.2cqw] shadow-2xl ${caption ? "pb-[2.5cqw]" : "pb-[7cqw]"} ${className}`}
      style={{ ...style, transform: `rotate(${rotate}deg)`, ["--r" as string]: `${rotate}deg`, ...delay(delayMs) }}
    >
      <img src={photo.url} alt="" draggable={false} className="aspect-[4/5] w-full object-cover" />
      {caption && (
        <figcaption className="mt-[1.6cqw] truncate text-center font-display text-[4.4cqw] italic text-[#3d2b22]">{label}</figcaption>
      )}
    </figure>
  );
}

/** A slow-scrolling wall of the period's photos behind the big number. */
function PhotoWall({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;
  const tiles = Array.from({ length: 18 }, (_, i) => photos[i % photos.length]);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
      <div className="pan-up grid grid-cols-3 gap-[1.5cqw] p-[1.5cqw]">
        {[...tiles, ...tiles].map((p, i) => (
          <img key={i} src={p.thumbUrl} alt="" className="aspect-square w-full rounded-[1.5cqw] object-cover" draggable={false} />
        ))}
      </div>
    </div>
  );
}

function Montage({ photos, paused }: { photos: Photo[]; paused: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused || i >= photos.length - 1) return;
    const t = setTimeout(() => setI((x) => x + 1), 1300);
    return () => clearTimeout(t);
  }, [i, paused, photos.length]);
  useEffect(() => {
    const p = photos[i + 1];
    if (p) new Image().src = p.url;
  }, [i, photos]);

  const current = photos[i];
  return (
    <div className="absolute inset-0 bg-black">
      {photos.map((p, k) =>
        k >= i - 1 && k <= i ? (
          <img
            key={p.id}
            src={p.url}
            alt=""
            draggable={false}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${k === i ? "kenburns opacity-100" : "opacity-0"}`}
            style={{ transformOrigin: ["30% 40%", "70% 35%", "50% 60%"][k % 3], animationPlayState: paused ? "paused" : "running" }}
          />
        ) : null,
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60" />
      <div className="absolute inset-x-0 bottom-0 px-[7cqw] pb-[12cqw] text-white">
        <p className="text-[3.4cqw] font-semibold uppercase tracking-[0.25em] opacity-80">Every moment, in order</p>
        <p className="mt-[1.5cqw] font-display text-[7cqw] italic">
          {current.caption?.trim() || formatDate(Date.parse(current.takenAt), "dayYear")}
        </p>
        <p className="mt-[1cqw] text-[3.4cqw] opacity-70">
          {i + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
}

function Summary({ wrap, restart, close }: { wrap: Wrap; restart: () => void; close: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadPostFonts();
      const cover = wrap.cover ? await loadImage(wrap.cover.url).catch(() => null) : null;
      if (!cancelled && canvas.current) renderWrappedCard(canvas.current, wrap, cover);
    })();
    return () => {
      cancelled = true;
    };
  }, [wrap]);

  async function save() {
    if (!canvas.current) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await canvasToJpeg(canvas.current);
      const name = `${wrap.title.toLowerCase().replace(/\s+/g, "-")}-wrapped.jpg`;
      await shareOrDownload(blob, name, `${wrap.title} Wrapped`);
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  }

  const that = wrap.kind === "month" ? `our ${wrap.title}` : wrap.title.replace(/^Our/, "our");
  return (
    <div className="flex h-full flex-col items-center px-[7cqw] pb-[6cqw] pt-[17cqw] text-center">
      <p className="rise font-display text-[7.5cqw] italic leading-tight" style={delay(100)}>
        That was {that}
      </p>
      <div className="zoom-in mt-[4cqw] min-h-0 flex-1" style={delay(300)}>
        <canvas
          ref={canvas}
          width={CARD.width}
          height={CARD.height}
          aria-label="Wrapped summary card"
          className="h-full w-auto rounded-[2cqw] shadow-2xl"
          style={{ aspectRatio: `${CARD.width} / ${CARD.height}` }}
        />
      </div>
      <div className="rise mt-[5cqw] flex w-full flex-col gap-[2.5cqw]" style={delay(700)}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="press inline-flex w-full items-center justify-center gap-[2cqw] rounded-full bg-[var(--fg)] py-[3.6cqw] text-[4.2cqw] font-semibold text-[#3d2b22] disabled:opacity-60"
        >
          <Share aria-hidden="true" className="size-[4.6cqw]" />
          {saving ? "Saving…" : "Save for our story"}
        </button>
        <div className="flex gap-[2.5cqw]">
          <button
            type="button"
            onClick={restart}
            className="press inline-flex flex-1 items-center justify-center gap-[1.5cqw] rounded-full border border-[var(--soft)] py-[3cqw] text-[3.8cqw] font-medium hover:bg-white/10"
          >
            <RotateCcw aria-hidden="true" className="size-[4cqw]" />
            Watch again
          </button>
          <button
            type="button"
            onClick={close}
            className="press inline-flex flex-1 items-center justify-center gap-[1.5cqw] rounded-full border border-[var(--soft)] py-[3cqw] text-[3.8cqw] font-medium hover:bg-white/10"
          >
            <X aria-hidden="true" className="size-[4cqw]" />
            Close
          </button>
        </div>
        {error && <p className="text-[3.4cqw] text-[#f3a7b4]">{error}</p>}
      </div>
    </div>
  );
}

/** Soft floating shapes behind each slide, a little different every time. */
function Shapes({ variant }: { variant: number }) {
  const sets = [
    [
      { kind: "blob", size: 90, x: -30, y: -20, dx: 30, dy: 40 },
      { kind: "ring", size: 55, x: 62, y: 70, dx: -20, dy: -30 },
      { kind: "heart", size: 22, x: 74, y: 12, dx: -10, dy: 20 },
    ],
    [
      { kind: "ring", size: 80, x: 45, y: -25, dx: -25, dy: 30 },
      { kind: "blob", size: 70, x: -25, y: 75, dx: 30, dy: -20 },
      { kind: "heart", size: 16, x: 12, y: 18, dx: 15, dy: 25 },
    ],
    [
      { kind: "blob", size: 75, x: 55, y: 60, dx: -30, dy: -25 },
      { kind: "ring", size: 45, x: -12, y: 8, dx: 20, dy: 30 },
      { kind: "heart", size: 18, x: 78, y: 24, dx: -15, dy: 10 },
    ],
  ];
  const set = sets[variant % sets.length];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {set.map((s, i) => {
        const style = {
          width: `${s.size}cqw`,
          height: `${s.size}cqw`,
          left: `${s.x}%`,
          top: `${s.y}%`,
          ["--dx" as string]: `${s.dx}cqw`,
          ["--dy" as string]: `${s.dy}cqw`,
          animationDelay: `${-i * 3}s`,
        } as React.CSSProperties;
        if (s.kind === "heart") {
          return (
            <span key={i} className="drift absolute" style={{ ...style, color: "var(--soft)" }}>
              <Heart className="size-full" />
            </span>
          );
        }
        return (
          <span
            key={i}
            className="drift absolute rounded-full"
            style={{
              ...style,
              background: s.kind === "blob" ? "var(--soft)" : "transparent",
              border: s.kind === "ring" ? "2px solid var(--soft)" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
