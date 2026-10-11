/*
 * The case study wipe. Opening is a CSS animation (`.case-wipe-in` in
 * globals.css) that reveals the case study from the bottom edge up. Closing
 * happens however the visitor leaves: [← BACK], Escape, the home mark or the
 * browser's back button. By then React has already hidden the case study, so
 * the wipe down plays on a snapshot of it: a static copy laid over the page,
 * wiped away top edge first, then removed.
 *
 * This is used instead of view transitions because the browser's back button
 * doesn't run as one, and the brief asks for the same wipe either way.
 */

const EASE = "cubic-bezier(0.76, 0, 0.24, 1)";

let nextProject = false;

/**
 * Called by "Next: [BRAND GUIDES]": the case study being left holds still under the
 * next one as it wipes up, instead of wiping away.
 */
export function markNextProject() {
  nextProject = true;
  // From a case study's own URL nothing is left behind, so don't let the flag
  // linger into the next close.
  setTimeout(() => (nextProject = false), 1000);
}

/** Wipe a copy of `node` (scrolled to `scrollTop`) down off the screen. */
export function wipeOut(node: HTMLElement, scrollTop: number) {
  const hold = nextProject;
  nextProject = false;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ghost = document.createElement("div");
  ghost.setAttribute("aria-hidden", "true");
  ghost.inert = true;
  // Above the page, below a case study that's opening over it.
  ghost.style.cssText = "position:fixed;inset:0;z-index:49;overflow:hidden;pointer-events:none;background:var(--color-bg)";

  const copy = node.cloneNode(true) as HTMLElement;
  // React hides the original with an inline display:none; the copy stays in
  // the ghost rather than fixed to the viewport, so the clip applies to it.
  copy.style.display = "";
  copy.style.position = "absolute";
  copy.style.inset = "0";
  copy.removeAttribute("role");
  copy.removeAttribute("aria-modal");
  ghost.append(copy);
  document.body.append(ghost);

  if (copy.scrollHeight > copy.clientHeight) copy.scrollTop = scrollTop;
  else copy.style.marginTop = `${-scrollTop}px`;

  const animation = hold
    ? ghost.animate([{ opacity: 1 }, { opacity: 1 }], { duration: reduced ? 200 : 700 })
    : reduced
      ? ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" })
      : ghost.animate([{ clipPath: "inset(0 0 0 0)" }, { clipPath: "inset(100% 0 0 0)" }], {
          duration: 600,
          easing: EASE,
          fill: "forwards",
        });
  animation.finished.then(
    () => ghost.remove(),
    () => ghost.remove(),
  );
}
