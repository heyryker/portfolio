/*
 * No case study over any other page. default.tsx only covers a full page
 * load: on a client-side navigation Next keeps a parallel slot showing what it
 * last matched, so without these, picking ABOUT or BLOG from the menu inside
 * an open case study changed the URL but left the case study on screen.
 */
export default function NoCaseStudy() {
  return null;
}
