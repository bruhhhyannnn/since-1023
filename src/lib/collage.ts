/*
 * Draws the monthsary post on a <canvas>, right in the browser.
 * Instagram sizes: feed post 1080×1350 (4:5) and story 1080×1920 (9:16).
 */

export type PostFormat = "post" | "story";

export const POST_SIZES: Record<PostFormat, { width: number; height: number; label: string }> = {
  post: { width: 1080, height: 1350, label: "Post 4:5" },
  story: { width: 1080, height: 1920, label: "Story 9:16" },
};

export const MAX_PHOTOS = 9;

const C = {
  cream: "#fbf6ec",
  wheat: "#f3e4c4",
  wheatDeep: "#e5cd9f",
  tan: "#c9a47a",
  brown: "#7a5c40",
  cocoa: "#3d2b22",
  burgundy: "#7a1f2e",
};
export const DISPLAY = '"Cormorant Garamond Variable", "Cormorant Garamond", Georgia, serif';
export const SANS = '"DM Sans Variable", "DM Sans", system-ui, sans-serif';

export type PostContent = {
  format: PostFormat;
  names: string; // "Bryan & Cecilia"
  title: string; // "86th Monthsary"
  subtitle: string; // "7 years & 2 months together"
  message: string;
  from: string; // "10.23.2019"
  to: string; // "12.23.2026"
  images: HTMLImageElement[];
};

/** Wait for our fonts so the canvas doesn't fall back to Times. */
export async function loadPostFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all([
    document.fonts.load(`italic 600 96px ${DISPLAY}`, "Monthsary 0123456789"),
    document.fonts.load(`italic 500 40px ${DISPLAY}`, "together"),
    document.fonts.load(`500 26px ${SANS}`, "BRYAN & CECILIA 0123456789."),
    document.fonts.load(`800 64px ${SANS}`, "WRAPPED 0123456789"),
  ]).catch(() => undefined);
}

const imageCache = new Map<string, Promise<HTMLImageElement>>();

/** Load a photo so it can be drawn (and exported) from the canvas. */
export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = imageCache.get(url);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("A photo couldn't be loaded."));
      img.src = url;
    });
    p.catch(() => imageCache.delete(url));
    imageCache.set(url, p);
  }
  return p;
}

type Rect = { x: number; y: number; w: number; h: number };

export function roundRect(ctx: CanvasRenderingContext2D, { x, y, w, h }: Rect, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function heartPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const s = size / 24;
  const x = cx - 12 * s;
  const y = cy - 12.5 * s;
  ctx.beginPath();
  ctx.moveTo(x + 12 * s, y + 20.5 * s);
  ctx.bezierCurveTo(x + 12 * s, y + 20.5 * s, x + 4.5 * s, y + 15.9 * s, x + 2.6 * s, y + 11.2 * s);
  ctx.bezierCurveTo(x + 1.3 * s, y + 7.9 * s, x + 3.3 * s, y + 4.5 * s, x + 6.7 * s, y + 4.5 * s);
  ctx.bezierCurveTo(x + 8.8 * s, y + 4.5 * s, x + 10.3 * s, y + 5.7 * s, x + 12 * s, y + 7.4 * s);
  ctx.bezierCurveTo(x + 13.7 * s, y + 5.7 * s, x + 15.2 * s, y + 4.5 * s, x + 17.3 * s, y + 4.5 * s);
  ctx.bezierCurveTo(x + 20.7 * s, y + 4.5 * s, x + 22.7 * s, y + 7.9 * s, x + 21.4 * s, y + 11.2 * s);
  ctx.bezierCurveTo(x + 19.5 * s, y + 15.9 * s, x + 12 * s, y + 20.5 * s, x + 12 * s, y + 20.5 * s);
  ctx.closePath();
}

/** Centered text with letter spacing (drawn per character; works in every browser). */
export function spacedText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + spacing;
  });
  ctx.textAlign = "center";
  return total;
}

/** Largest font size (down to `min`) at which `text` fits in `maxWidth`. */
export function fit(ctx: CanvasRenderingContext2D, text: string, font: (size: number) => string, size: number, maxWidth: number, min = 18) {
  let s = size;
  ctx.font = font(s);
  while (ctx.measureText(text).width > maxWidth && s > min) {
    s -= 2;
    ctx.font = font(s);
  }
  return s;
}

/** Draw `img` to fill `r`, cropping the overflow (a bit above center, where faces usually are). */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, r: Rect, radius: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(r.w / iw, r.h / ih);
  const sw = r.w / scale;
  const sh = r.h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) * 0.4;
  ctx.save();
  roundRect(ctx, r, radius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
  ctx.restore();
  ctx.save();
  roundRect(ctx, r, radius);
  ctx.strokeStyle = "rgba(61, 43, 34, 0.10)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Split the photo area into tiles: rows of equal height, photos side by side. */
export function layoutTiles(count: number, area: Rect, gap: number): Rect[] {
  if (count <= 0) return [];
  if (count === 3) {
    // One big photo on the left, two stacked on the right.
    const bigW = Math.round((area.w - gap) * 0.58);
    const smallW = area.w - gap - bigW;
    const halfH = (area.h - gap) / 2;
    return [
      { x: area.x, y: area.y, w: bigW, h: area.h },
      { x: area.x + bigW + gap, y: area.y, w: smallW, h: halfH },
      { x: area.x + bigW + gap, y: area.y + halfH + gap, w: smallW, h: halfH },
    ];
  }
  const rows: Record<number, number[]> = {
    1: [1],
    2: [2],
    4: [2, 2],
    5: [2, 3],
    6: [3, 3],
    7: [2, 3, 2],
    8: [3, 2, 3],
    9: [3, 3, 3],
  };
  const plan = rows[Math.min(count, MAX_PHOTOS)];
  const rowH = (area.h - gap * (plan.length - 1)) / plan.length;
  const tiles: Rect[] = [];
  plan.forEach((cols, r) => {
    const w = (area.w - gap * (cols - 1)) / cols;
    for (let c = 0; c < cols; c++) {
      tiles.push({ x: area.x + c * (w + gap), y: area.y + r * (rowH + gap), w, h: rowH });
    }
  });
  return tiles;
}

export function renderPost(canvas: HTMLCanvasElement, content: PostContent): void {
  const { width: W, height: H } = POST_SIZES[content.format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const story = content.format === "story";
  const cx = W / 2;

  // Paper background with a soft wheat glow and a thin frame.
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(cx, 0, 0, cx, 0, H * 0.7);
  glow.addColorStop(0, "rgba(243, 228, 196, 0.9)");
  glow.addColorStop(1, "rgba(243, 228, 196, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, { x: 30, y: 30, w: W - 60, h: H - 60 }, 34);
  ctx.strokeStyle = C.wheatDeep;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Instagram covers the top and bottom of stories with its own UI, so we leave room there.
  const top = story ? 250 : 88;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = C.brown;
  ctx.font = `500 26px ${SANS}`;
  spacedText(ctx, content.names.toUpperCase(), cx, top + 30, 7);

  ctx.fillStyle = C.burgundy;
  fit(ctx, content.title, (s) => `italic 600 ${s}px ${DISPLAY}`, story ? 116 : 100, W - 160);
  ctx.fillText(content.title, cx, top + (story ? 140 : 128));

  ctx.fillStyle = C.brown;
  fit(ctx, content.subtitle, (s) => `italic 500 ${s}px ${DISPLAY}`, 40, W - 200);
  ctx.fillText(content.subtitle, cx, top + (story ? 200 : 180));

  // Footer: optional message, then the two dates with a heart between them.
  const hasMessage = content.message.trim().length > 0;
  const bottom = story ? H - 270 : H - 72;
  const datesY = bottom;
  const messageY = bottom - 60;
  const photosBottom = (hasMessage ? messageY - 50 : datesY - 52) - (story ? 10 : 0);

  const area: Rect = { x: 72, y: top + (story ? 250 : 224), w: W - 144, h: 0 };
  area.h = photosBottom - area.y;

  const tiles = layoutTiles(content.images.length, area, 14);
  if (tiles.length === 0) {
    roundRect(ctx, area, 24);
    ctx.fillStyle = C.wheat;
    ctx.fill();
    ctx.fillStyle = C.tan;
    heartPath(ctx, cx, area.y + area.h / 2 - 20, 64);
    ctx.fill();
    ctx.fillStyle = C.brown;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText("Pick some photos", cx, area.y + area.h / 2 + 50);
  } else {
    tiles.forEach((t, i) => drawCover(ctx, content.images[i], t, 22));
  }

  if (hasMessage) {
    ctx.fillStyle = C.cocoa;
    fit(ctx, content.message.trim(), (s) => `italic 500 ${s}px ${DISPLAY}`, 44, W - 180, 24);
    ctx.fillText(content.message.trim(), cx, messageY);
  }

  ctx.font = `500 26px ${SANS}`;
  ctx.fillStyle = C.brown;
  const gapForHeart = 70;
  ctx.textAlign = "right";
  ctx.fillText(content.from, cx - gapForHeart / 2, datesY);
  ctx.textAlign = "left";
  ctx.fillText(content.to, cx + gapForHeart / 2, datesY);
  ctx.textAlign = "center";
  ctx.fillStyle = C.burgundy;
  heartPath(ctx, cx, datesY - 9, 26);
  ctx.fill();
}

export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create the image."))), "image/jpeg", 0.93),
  );
}

/** Share an image (phone share sheet, e.g. to Instagram), or download it where sharing isn't available. */
export async function shareOrDownload(blob: Blob, fileName: string, title: string): Promise<void> {
  const file = new File([blob], fileName, { type: "image/jpeg" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
