import Link from "next/link";
import { HomeName } from "@/components/HomeName";
import { LocalClock } from "@/components/LocalClock";
import { SiteMenu } from "@/components/SiteMenu";

/**
 * Top bar: "Ryker Marble" as the home link (left) and the menu button (right).
 * It scrolls with the page, with no background behind it.
 *
 * `centered` (the landing page and the project views) puts the name in the
 * middle instead, in the sans serif, after studio sites like Porto Rocha's.
 * On the landing page (`clock`), today's date and my local time sit under
 * it, and the name is the page's heading.
 */
export function SiteHeader({ centered = false, clock = false }: { centered?: boolean; clock?: boolean }) {
  if (!centered) {
    return (
      <header className="site-header pointer-events-none absolute inset-x-0 top-0 z-30">
        <HomeName />
        <SiteMenu />
      </header>
    );
  }

  return (
    <header className="site-header-centered relative z-30">
      <div className="site-header-name">
        {clock ? (
          <h1 className="site-header-wordmark">Ryker Marble</h1>
        ) : (
          <Link href="/" className="site-header-wordmark">
            Ryker Marble
          </Link>
        )}
        {clock && <LocalClock />}
      </div>
      <SiteMenu />
    </header>
  );
}
