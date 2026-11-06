import type { Metadata } from "next";
import { Figtree, Newsreader } from "next/font/google";
import { ChartaConcept } from "./ChartaConcept";

/*
 * Charta Health's site uses Satoshi (body) and PP Fragment Glare (headings).
 * Fragment is a licensed font, so rather than hot-link their files this
 * concept uses close free stand-ins: Figtree for Satoshi, Newsreader for
 * Fragment.
 */
const sans = Figtree({ subsets: ["latin"], variable: "--font-charta-sans" });
const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-charta-serif",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

/*
 * A private interview piece, not portfolio work: it is kept out of the menu,
 * the sitemap, llms.txt and the All work rack, and asks search engines not to
 * index it. robots.txt does not disallow it on purpose, because a crawler
 * that can't fetch the page never sees the noindex.
 */
export const metadata: Metadata = {
  title: "Charta Health homepage concept",
  description: "An unofficial homepage redesign concept for Charta Health by Ryker Marble.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: null,
  twitter: null,
};

export default function ChartaHealthPage() {
  return (
    <div className={`${sans.variable} ${serif.variable}`}>
      <ChartaConcept />
    </div>
  );
}
