import Link from "next/link";
import { SiteMenu } from "@/components/SiteMenu";

/** Top bar: the pixel-square home mark (left) and the menu button (right). */
export function SiteHeader() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      {/* Home mark: one meeple pixel, centered on the first grid intersection. */}
      <Link
        href="/"
        aria-label="Ryker Marble, home"
        className="pointer-events-auto absolute top-[22px] left-[22px] grid size-11 place-items-center"
      >
        <span aria-hidden="true" className="block size-3 bg-accent" />
      </Link>

      <SiteMenu />
    </header>
  );
}
