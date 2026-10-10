import Link from "next/link";

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

      {/* TODO: wire up the full-screen menu in build step 5 (CLAUDE.md §6). */}
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded="false"
        className="pointer-events-auto absolute top-[22px] right-[22px] grid size-11 cursor-pointer place-items-center md:right-[53px]"
      >
        <span aria-hidden="true" className="flex w-[46px] flex-col gap-[5px] max-md:w-8">
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
        </span>
      </button>
    </header>
  );
}
