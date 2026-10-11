"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Icon } from "@/components/Icon";
import { Meeple } from "@/components/Meeple";
import { CASE_STUDIES } from "@/lib/work";

const EMAIL = "rykermarble@gmail.com";
const RESUME = "/resume/ryker-marble-resume.pdf";

const MORE = [
  { href: "/about", label: "ABOUT" },
  { href: "/about#contact", label: "CONTACT" },
] as const;

const SOCIAL = [
  { href: "https://www.linkedin.com/in/ryker-marble/", label: "LINKEDIN" },
  { href: "https://github.com/heyryker", label: "GITHUB" },
] as const;

/** A small bracketed column label, centered in a one-cell row. */
function MenuLabel({ children, id }: { children: React.ReactNode; id: string }) {
  return (
    <h2 id={id} className="menu-label">
      [{children}]
    </h2>
  );
}

/**
 * The hamburger and the full-screen menu it opens (CLAUDE.md §6).
 *
 * The menu is a native modal <dialog>: showModal() makes the page behind it
 * inert, which traps focus, and Esc closes it, with focus returning to the
 * hamburger. It sits on the same graph paper as the landing page, with every
 * row on a grid line (see `.site-menu` in globals.css).
 */
export function SiteMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  const close = () => dialog.current?.close();

  // Any link closes the menu. Most navigate away and unmount it anyway, but a
  // same-page link (CONTACT from /about) would otherwise leave it open.
  const onClick = (e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest("a")) close();
  };

  const current = (href: string) => (href === pathname ? "page" : undefined);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-controls="site-menu"
        onClick={() => dialog.current?.showModal()}
        className="pointer-events-auto absolute top-[22px] right-[22px] grid size-11 cursor-pointer place-items-center md:right-[53px]"
      >
        <span aria-hidden="true" className="flex w-[46px] flex-col gap-[5px] max-md:w-8">
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
          <span className="block h-1 bg-ink-soft max-md:h-[3px]" />
        </span>
      </button>

      <dialog
        ref={dialog}
        id="site-menu"
        aria-label="Menu"
        // Keeps the meeple engine from treating taps on the menu as grabs.
        data-meeple-ignore=""
        onClick={onClick}
        className="site-menu bg-graph pointer-events-auto"
      >
        {/* The home mark stays put, exactly where it is on the page. */}
        <Link
          href="/"
          aria-label="Ryker Marble, home"
          className="absolute top-[22px] left-[22px] grid size-11 place-items-center"
        >
          <span aria-hidden="true" className="block size-3 bg-accent" />
        </Link>

        {/* Where the hamburger was. */}
        <button
          type="button"
          aria-label="Close menu"
          autoFocus
          onClick={close}
          className="absolute top-[22px] right-[22px] grid size-11 cursor-pointer place-items-center text-ink-soft transition-colors hover:text-accent focus-visible:text-accent md:right-[53px]"
        >
          <Icon name="close" className="size-10 max-md:size-8" />
        </button>

        <div className="menu-body">
          <nav aria-label="Site" className="menu-columns">
            <section aria-labelledby="menu-work">
              <MenuLabel id="menu-work">WORK</MenuLabel>
              <ul className="menu-list">
                {CASE_STUDIES.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link href={`/work/${slug}`} aria-current={current(`/work/${slug}`)} className="menu-link">
                      <span className="menu-text">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="menu-more">
              <MenuLabel id="menu-more">MORE</MenuLabel>
              <ul className="menu-list">
                {MORE.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} aria-current={current(href)} className="menu-link">
                      <span className="menu-text">{label}</span>
                    </Link>
                  </li>
                ))}
                <li className="flex items-start gap-[calc(var(--grid-cell)/2)]">
                  <a href={RESUME} target="_blank" rel="noopener" className="menu-link">
                    <span className="menu-text">
                      RESUME
                      <Icon name="arrow_outward" className="menu-icon" />
                    </span>
                    <span className="sr-only"> (PDF, opens in a new tab)</span>
                  </a>
                  <a
                    href={RESUME}
                    download="Ryker-Marble-Resume.pdf"
                    aria-label="Download resume PDF"
                    className="menu-download"
                  >
                    <Icon name="download" />
                  </a>
                </li>
              </ul>
            </section>
          </nav>

          <ul className="menu-contact" aria-label="Elsewhere">
            <li>
              <a href={`mailto:${EMAIL}`} className="menu-contact-link">
                <Icon name="mail" className="size-[1.15em]" />
                {EMAIL}
              </a>
            </li>
            {SOCIAL.map(({ href, label }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener" className="menu-contact-link">
                  [{label}]
                  <Icon name="arrow_outward" className="size-[1.15em]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* The Curious One, peeking up from the bottom edge (§6). */}
        <Meeple color="var(--color-meeple-yellow)" className="menu-meeple" />
      </dialog>
    </>
  );
}
