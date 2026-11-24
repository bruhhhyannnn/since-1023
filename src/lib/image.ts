import { DAY, fromExifValue } from "./time";

/*
 * Browser-side photo prep: photos are shrunk to JPEG on the phone before
 * uploading, so uploads are quick and storage lasts for years.
 */

export const FULL_SIDE = 2048;
export const THUMB_SIDE = 640;
const MAX_BYTES = 3_600_000;

/** When the photo was taken, from its EXIF data, falling back to the file date. */
export async function readTakenAt(file: File): Promise<number> {
  try {
    const { default: exifr } = await import("exifr");
    const data = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate"],
      reviveValues: false,
    });
    const raw = data?.DateTimeOriginal ?? data?.CreateDate;
    if (typeof raw === "string") {
      const ms = fromExifValue(raw);
      if (ms !== null && ms < Date.now() + DAY) return ms;
    }
  } catch {
    // No EXIF (screenshots, downloads): fall back below.
  }
  return file.lastModified || Date.now();
}

type Decoded = { image: CanvasImageSource; width: number; height: number; close: () => void };

async function decode(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      // Fall through to <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This photo's format can't be opened here. Try a JPEG or PNG, or upload from your phone.");
  }
  return { image: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process this photo."))), "image/jpeg", quality),
  );

export type Jpeg = { blob: Blob; width: number; height: number };

/** Resize so the longest side is at most `maxSide`, as JPEG. */
export async function resizeToJpeg(file: Blob, maxSide: number, quality: number): Promise<Jpeg> {
  const src = await decode(file);
  try {
    const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
    const width = Math.max(1, Math.round(src.width * scale));
    const height = Math.max(1, Math.round(src.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process this photo.");
    ctx.fillStyle = "#ffffff"; // PNG transparency → white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src.image, 0, 0, width, height);

    let q = quality;
    let blob = await canvasToBlob(canvas, q);
    while (blob.size > MAX_BYTES && q > 0.5) {
      q -= 0.1;
      blob = await canvasToBlob(canvas, q);
    }
    canvas.width = canvas.height = 0; // free memory on iOS
    return { blob, width, height };
  } finally {
    src.close();
  }
}
