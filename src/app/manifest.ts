import type { MetadataRoute } from "next";
import { COUPLE } from "@/lib/us";

/** Lets the site be added to the home screen and open like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${COUPLE} · since 10.23.19`,
    short_name: "since 10·23",
    description: `Every year, month, day, hour, minute and second of ${COUPLE}.`,
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ec",
    theme_color: "#fbf6ec",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
