import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import { COUPLE } from "@/lib/us";

/* The preview card people see when the link is shared (Messenger, Instagram, etc.). */

export const alt = `${COUPLE}, together since October 23, 2019`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Read once at build time (the card never changes). */
async function fonts() {
  "use cache";
  cacheLife("max");
  const dir = join(process.cwd(), "node_modules/@fontsource/cormorant-garamond/files");
  const [italic, regular] = await Promise.all([
    readFile(join(dir, "cormorant-garamond-latin-600-italic.woff")),
    readFile(join(dir, "cormorant-garamond-latin-600-normal.woff")),
  ]);
  return { italic: new Uint8Array(italic).buffer, regular: new Uint8Array(regular).buffer };
}

const HEART =
  "M12 20.5s-7.5-4.6-9.4-9.3C1.3 7.9 3.3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.4 0 5.4 3.4 4.1 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z";

export default async function Image() {
  const { italic, regular } = await fonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #fbf6ec 0%, #f3e4c4 100%)",
          color: "#7a1f2e",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -120, left: -120, width: 420, height: 420, borderRadius: 999, border: "3px solid rgba(201,164,122,0.35)" }} />
        <div style={{ position: "absolute", bottom: -160, right: -100, width: 480, height: 480, borderRadius: 999, background: "rgba(229,205,159,0.45)" }} />
        <svg width="64" height="64" viewBox="0 0 24 24">
          <path d={HEART} fill="#7a1f2e" />
        </svg>
        <div style={{ marginTop: 18, fontFamily: "Cormorant Italic", fontSize: 128, lineHeight: 1 }}>{COUPLE}</div>
        <div style={{ marginTop: 26, fontFamily: "Cormorant", fontSize: 44, color: "#7a5c40" }}>
          together since October 23, 2019 · 7:00 PM
        </div>
        <div style={{ marginTop: 34, fontFamily: "Cormorant Italic", fontSize: 34, color: "#c9a47a" }}>since 10·23</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant Italic", data: italic, style: "italic", weight: 600 },
        { name: "Cormorant", data: regular, style: "normal", weight: 600 },
      ],
    },
  );
}
