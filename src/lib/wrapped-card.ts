import { DISPLAY, SANS, drawCover, fit, heartPath, roundRect, spacedText } from "./collage";
import { formatDate, num } from "./format";
import { START, monthsaryTitle } from "./time";
import { COUPLE } from "./us";
import { TIMES, type Wrap } from "./wrapped";

/** The summary card at the end of a Wrapped story, sized for an Instagram story. */
export const CARD = { width: 1080, height: 1920 };

export function renderWrappedCard(canvas: HTMLCanvasElement, wrap: Wrap, cover: HTMLImageElement | null): void {
  const { width: W, height: H } = CARD;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const cx = W / 2;

  // Burgundy, with a few soft rings.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#7a1f2e");
  bg.addColorStop(1, "#3a0f17");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(243, 228, 196, 0.10)";
  ctx.lineWidth = 3;
  for (const [x, y, r] of [
    [930, 260, 260],
    [120, 1480, 330],
    [1000, 1700, 170],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Instagram covers the top and bottom of stories, so everything sits inside.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(243, 228, 196, 0.8)";
  ctx.font = `500 30px ${SANS}`;
  spacedText(ctx, COUPLE.toUpperCase(), cx, 250, 8);

  ctx.fillStyle = "#fbf6ec";
  fit(ctx, wrap.title, (s) => `italic 600 ${s}px ${DISPLAY}`, 124, W - 140);
  ctx.fillText(wrap.title, cx, 384);

  ctx.fillStyle = "#e5cd9f";
  ctx.font = `800 44px ${SANS}`;
  spacedText(ctx, "WRAPPED", cx, 456, 16);

  // The cover photo as a tilted polaroid.
  ctx.save();
  ctx.translate(cx, 880);
  ctx.rotate(-0.055);
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  roundRect(ctx, { x: -300, y: -360, w: 600, h: 720 }, 8);
  ctx.fillStyle = "#fffcf6";
  ctx.fill();
  ctx.shadowColor = "transparent";
  const photoBox = { x: -270, y: -330, w: 540, h: 560 };
  if (cover) drawCover(ctx, cover, photoBox, 4);
  else {
    roundRect(ctx, photoBox, 4);
    ctx.fillStyle = "#f3e4c4";
    ctx.fill();
  }
  if (wrap.cover) {
    ctx.fillStyle = "#3d2b22";
    fit(ctx, wrap.cover.caption ?? formatDate(Date.parse(wrap.cover.takenAt), "range"), (s) => `italic 500 ${s}px ${DISPLAY}`, 40, 500, 24);
    ctx.fillText(wrap.cover.caption ?? formatDate(Date.parse(wrap.cover.takenAt), "range"), 0, 300);
  }
  ctx.restore();

  // Four stats.
  const topTime = TIMES.find((t) => t.key === wrap.topTime)?.label;
  const fourth: [string, string] = wrap.topAlbum
    ? ["Biggest month", monthsaryTitle(wrap.topAlbum.n)]
    : wrap.busiest
      ? ["Busiest day", formatDate(wrap.busiest.day, "short")]
      : ["Favorites", num(wrap.favorites.length)];
  const stats: [string, string][] = [
    ["Moments", num(wrap.photos.length)],
    ["Days with photos", num(wrap.days)],
    ["Our time of day", topTime ?? "All of it"],
    fourth,
  ];
  stats.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 150 : 590;
    const y = 1380 + Math.floor(i / 2) * 170;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(243, 228, 196, 0.7)";
    ctx.font = `500 24px ${SANS}`;
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = "#fbf6ec";
    fit(ctx, value, (s) => `800 ${s}px ${SANS}`, 62, 380, 30);
    ctx.fillText(value, x, y + 68);
  });

  // Footer.
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(243, 228, 196, 0.85)";
  ctx.font = `500 28px ${SANS}`;
  const since = `since ${formatDate(START, "dots")}`;
  ctx.fillText(since, cx + 22, 1690);
  const w = ctx.measureText(since).width;
  ctx.fillStyle = "#e8768a";
  heartPath(ctx, cx + 22 - w / 2 - 30, 1680, 30);
  ctx.fill();
}
