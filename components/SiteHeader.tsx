import { HomeName } from "@/components/HomeName";
import { SiteMenu } from "@/components/SiteMenu";

/**
 * Top bar: "Ryker Marble" as the home link (left) and the menu button (right).
 *
 * On the landing page (`sticky`), the bar stays at the top as you scroll, and
 * the name only slides in once the intro's "Hi, I'm Ryker" has scrolled away.
 * No background behind it (Ryker's call). Everywhere else the name is
 * always there and the bar scrolls with the page.
 */
export function SiteHeader({ sticky = false }: { sticky?: boolean }) {
  return (
    <header
      className={`site-header pointer-events-none inset-x-0 top-0 z-30 ${sticky ? "fixed" : "absolute"}`}
      data-sticky={sticky ? "" : undefined}
    >
      <HomeName revealAfter={sticky ? "landing-intro-title" : undefined} />
      <SiteMenu />
    </header>
  );
}
