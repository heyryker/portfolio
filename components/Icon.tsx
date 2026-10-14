/*
 * Icons from Google's Material Symbols (Sharp, weight 700), Apache-2.0:
 * https://fonts.google.com/icons. Sharp corners suit the pixel squares. The
 * paths are inlined, rather than loading the icon font, so the menu costs no
 * extra request and only ships the icons it uses. To add one, copy its path from
 * @material-symbols/svg-700/sharp/<name>.svg.
 */
const PATHS = {
  menu: "M95-203v-95h771v95H95Zm0-230v-94h771v94H95Zm0-229v-95h771v95H95Z",
  close:
    "m249-183-66-66 231-231-231-231 66-66 231 231 231-231 66 66-231 231 231 231-66 66-231-231-231 231Z",
  arrow_outward: "m250-221-67-67 395-395H224v-94h515v514h-95v-353L250-221Z",
  download:
    "M480-322 251-551l68-66 114 114v-323h94v323l114-114 68 66-229 229ZM135-135v-237h94v143h502v-143h95v237H135Z",
  volume_up:
    "M580-118v-75.2Q676-222 738-301t62-180q0-101-61.5-180.5T580-768.8V-844q128.23 28.75 209.61 130.37Q871-612 871-481t-81.39 232.63Q708.23-146.75 580-118ZM89-335v-291h175l236-235v762L264-335H89Zm471 32v-355q58 20 94.5 68.08T691-479.93q0 60.93-37 109.43-37 48.5-94 67.5ZM405-626l-100 95H184v102h121l100 96v-293Zm-85 146Z",
  volume_off:
    "M821-32 687-167q-25 17-54 29.5T572-118v-75q16-5 32.5-11t30.5-17L492-367v268L257-335H82v-291h157L24-846l50-50L872-84l-51 52Zm-17-248-51-53q20-33 29.5-70.42Q792-440.85 792-481q0-103.32-61-184.16T572-769v-75q128 29 210 130.5T864-481q0 54-15.5 105T804-280ZM671-415l-99-101v-135q50 24 81 70t31 101q0 17-3.5 33.5T671-415ZM492-598 362-731l130-130v263Zm-95 270v-136l-66-67H176v102h120l101 101Zm-33-169Z",
  sports:
    "M449.06-177q-110.98 0-187.02-76.21T186-440q0-8.33.5-16.17Q187-464 188-470q-3 0-6 .5t-4.62.5q-53.82 0-88.6-34.45Q54-537.91 54-591.25q0-53.77 33.5-88.76T174.39-715q35.16 0 66.89 20Q273-675 288-647q27-23 69.82-39.5Q400.64-703 450-703h456v143H712v120q0 110.58-76.19 186.79T449.06-177ZM206-562q11-11 11-29t-11-29q-11-11-29-11t-29 11q-11 11-11 29t11 29q11 11 29 11t29-11Zm299.5 178.5Q529-407 529-440t-23.5-56.5Q482-520 449-520t-56.5 23.5Q369-473 369-440t23.5 56.5Q416-360 449-360t56.5-23.5Z",
} as const;

export type IconName = keyof typeof PATHS;

/** A decorative Material Symbol. Size it with width/height (1em by default). */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 -960 960 960"
      // Attributes, not classes, so any size class passed in wins.
      width="1em"
      height="1em"
      fill="currentColor"
      className={`inline-block shrink-0 ${className ?? ""}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
