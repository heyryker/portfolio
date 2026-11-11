import type { Metadata, Viewport } from "next";
import { MagicEightBall } from "./MagicEightBall";

// Hidden on purpose, like /chartahealth: not in the menu, sitemap, llms.txt or
// the landing rack, and asks search engines not to index it.
export const metadata: Metadata = {
  title: "Magic 8 Ball",
  description: "Tap the ball to get your fortune.",
  alternates: { canonical: "/magic8" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#14052b",
};

export default function MagicEightPage() {
  return <MagicEightBall />;
}
