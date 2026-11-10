"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef } from "react";
import { Icon } from "@/components/Icon";

const RESUME = "/resume/ryker-marble-resume.pdf";

const CONJURE = "https://conjure-inky.vercel.app/";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/village", label: "Village" },
] as const;

/**
 * The hamburger and the full-screen menu it opens (CLAUDE.md §6).
 *
 * The menu is a native modal <dialog>: showModal() makes the page behind it
 * inert, which traps focus, and Esc closes it, with focus returning to the
 * hamburger. It matches the landing page: white, with each link a soft gray
 * rounded row in the sans serif, and round gray buttons to open and close it
 * (see `.site-menu` in globals.css).
 */
export function SiteMenu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  // A case study open over the landing page has its own menu, so two can be
  // in the page at once.
  const id = useId();

  const close = () => dialog.current?.close();

  // Any link closes the menu. Most navigate away and unmount it anyway, but a
  // link to the current page would otherwise leave it open.
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
        aria-controls={id}
        onClick={() => dialog.current?.showModal()}
        className="menu-button pointer-events-auto"
      >
        <Icon name="menu" className="size-6" />
      </button>

      <dialog
        ref={dialog}
        id={id}
        aria-label="Menu"
        // Keeps the meeple engine from treating taps on the menu as grabs.
        data-meeple-ignore=""
        onClick={onClick}
        className="site-menu pointer-events-auto"
      >
        <div className="menu-bar">
          <Link href="/" className="menu-pill">
            Ryker Marble
          </Link>
          {/* Where the hamburger was. */}
          <button type="button" aria-label="Close menu" autoFocus onClick={close} className="menu-button">
            <Icon name="close" className="size-6" />
          </button>
        </div>

        <nav aria-label="Site" className="menu-body">
          <ul className="menu-list">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} aria-current={current(href)} className="menu-link">
                  <span className="menu-text">{label}</span>
                </Link>
              </li>
            ))}
            <li>
              <a href={CONJURE} target="_blank" rel="noopener" className="menu-link">
                <span className="menu-text">
                  Conjure
                  <Icon name="arrow_outward" className="menu-icon" />
                </span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
            <li className="menu-row">
              <a href={RESUME} target="_blank" rel="noopener" className="menu-link">
                <span className="menu-text">
                  Resume
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
        </nav>
      </dialog>
    </>
  );
}
