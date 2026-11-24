import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant-garamond/wght.css";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/dm-sans/wght.css";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COUPLE, US } from "@/lib/us";

export const metadata: Metadata = {
  title: {
    default: `${COUPLE} · since 10.23.19`,
    template: `%s · ${COUPLE}`,
  },
  description: `Every year, month, day, hour, minute and second of ${US.me} and ${US.her}, since October 23, 2019.`,
};

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="paper flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
