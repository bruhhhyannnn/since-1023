"use client";

import { useEffect, useState } from "react";
import type { Photo } from "@/lib/photos";
import { US } from "@/lib/us";
import { Heart } from "./Heart";

const TITLE_MS = 3200;
const PHOTO_MS = 4500;

/** Where each photo's slow zoom drifts toward, for a little variety. */
const ORIGINS = ["30% 40%", "70% 35%", "50% 60%", "35% 65%", "65% 55%"];

/**
 * A little movie of the album, like Memories in the Photos app: a title card,
 * then each photo slowly zooming and crossfading into the next.
 */
export function Slideshow({
  photos,
  title,
  subtitle,
  onClose,
}: {
  photos: Photo[];
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  // -1 = title card, photos.length = ending card
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const atEnd = index >= photos.length;

  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    if (paused || atEnd) return;
    const t = setTimeout(() => setIndex((i) => i + 1), index < 0 ? TITLE_MS : PHOTO_MS);
    return () => clearTimeout(t);
  }, [index, paused, atEnd]);

  useEffect(() => {
    const p = photos[index + 1];
    if (p) new Image().src = p.url;
  }, [index, photos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, photos.length]);

  // Only the photos around the current one are mounted, so the old one can fade out.
  const visible = photos
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i >= index - 1 && i <= Math.max(index, 0) + 1);
  const shown = Math.min(Math.max(index, 0), photos.length - 1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} slideshow`}
      className="fixed inset-0 z-[60] select-none overflow-hidden bg-black text-white"
      onClick={() => !atEnd && setPaused((p) => !p)}
    >
      {visible.map(({ p, i }) => {
        const active = i === shown && !atEnd;
        return (
          <img
            key={p.id}
            src={p.url}
            alt=""
            draggable={false}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-[1200ms] ease-in-out ${
              active ? "opacity-100" : "opacity-0"
            } ${active && index >= 0 ? "kenburns" : ""}`}
            style={{
              transformOrigin: ORIGINS[i % ORIGINS.length],
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        );
      })}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40" />

      {/* Progress, like stories */}
      <div className="absolute inset-x-0 top-0 flex gap-1 px-3 pt-3">
        {photos.map((p, i) => (
          <div key={p.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              key={i === index ? `run-${index}` : "still"}
              className={`h-full bg-white ${i < index ? "w-full" : i === index ? "progress" : "w-0"}`}
              style={{ animationDuration: `${PHOTO_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close slideshow"
        className="absolute right-3 top-6 grid size-10 place-items-center rounded-full bg-black/30 text-xl backdrop-blur hover:bg-black/50"
      >
        ×
      </button>

      {/* Title card */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-1000 ${
          index < 0 ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-black/35" />
        <p className="relative text-xs uppercase tracking-[0.3em] text-white/80">
          {US.me} &amp; {US.her}
        </p>
        <h2 className="relative mt-3 font-display text-6xl font-semibold italic leading-none drop-shadow-lg sm:text-8xl">{title}</h2>
        <p className="relative mt-4 text-sm text-white/85">{subtitle}</p>
      </div>

      {/* Ending card */}
      {atEnd && (
        <div className="fade-in absolute inset-0 flex flex-col items-center justify-center bg-[#160f0c] px-6 text-center">
          <p className="flex items-center gap-2 font-display text-4xl italic">
            {US.me} <Heart className="beat size-6 text-[#e8768a]" /> {US.her}
          </p>
          <p className="mt-2 text-sm text-white/70">since October 23, 2019 · 7:00 PM</p>
          <div className="mt-8 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(-1);
              }}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-cocoa hover:bg-cream"
            >
              Watch again
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="rounded-full px-5 py-2.5 text-sm text-white/80 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {paused && !atEnd && (
        <p className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm backdrop-blur">
          Paused · tap to play
        </p>
      )}
    </div>
  );
}
