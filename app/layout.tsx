import type { Metadata, Viewport } from "next";
import { Inter, Silkscreen } from "next/font/google";
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
  metadataBase: new URL("https://heyryker.com"),
  title: {
    default: "Ryker Marble: Brand & Creative Lead",
    template: "%s | Ryker Marble",
  },
  description:
    "Ryker Marble is a brand and creative lead in Utah, working across strategy, craft and art direction for B2B SaaS, cybersecurity, Web3 and fintech brands.",
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
      </body>
    </html>
  );
}
