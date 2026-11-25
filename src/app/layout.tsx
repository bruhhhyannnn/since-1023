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
  appleWebApp: { capable: true, title: "since 10·23", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* Lets photos fade in without ever hiding them when JavaScript is off. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="paper flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
