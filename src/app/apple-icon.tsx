import { ImageResponse } from "next/og";

/* The icon on the home screen when the site is added from Safari ("Add to Home Screen"). */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #f3e4c4 0%, #e5cd9f 100%)",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 24 24">
          <path
            d="M12 20.5s-7.5-4.6-9.4-9.3C1.3 7.9 3.3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.5h2c.7-1.3 2.2-2.5 4.3-2.5 3.4 0 5.4 3.4 4.1 6.7-1.9 4.7-9.4 9.3-9.4 9.3Z"
            fill="#7a1f2e"
          />
        </svg>
      </div>
    ),
    size,
  );
}
