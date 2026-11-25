"use client";

/** An <img> that softly fades in once it has loaded (instead of popping in line by line). */
export function FadeImg({ className = "", onLoad, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line jsx-a11y/alt-text -- alt is passed through props
    <img
      {...props}
      draggable={false}
      ref={(el) => {
        // Already loaded before the page became interactive.
        if (el?.complete && el.naturalWidth > 0) el.dataset.loaded = "";
      }}
      onLoad={(e) => {
        e.currentTarget.dataset.loaded = "";
        onLoad?.(e);
      }}
      className={`fade-img ${className}`}
    />
  );
}
