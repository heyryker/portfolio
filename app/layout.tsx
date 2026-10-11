import type { Metadata, Viewport } from "next";
import { Inter, Silkscreen } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  // Pages set their own canonical URL and Open Graph fields (lib/site.ts);
  // these are the fallbacks.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children, work }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${silkscreen.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {/* The page. Made inert while a case study covers it. */}
        <div data-page="" className="contents">
          {children}
        </div>
        {/* A case study opened from inside the site wipes up over the page
            (app/@work). Empty otherwise. */}
        {work}
        <Analytics />
      </body>
    </html>
  );
}
