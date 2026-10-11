/*
 * Icons from Google's Material Symbols (Sharp, weight 700), Apache-2.0:
 * https://fonts.google.com/icons. Sharp corners suit the pixel squares, and
 * weight 700 matches the hamburger's heavy bars. The paths are inlined, rather
 * than loading the icon font, so the menu costs no extra request and only
 * ships the icons it uses. To add one, copy its path from
 * @material-symbols/svg-700/sharp/<name>.svg.
 */
const PATHS = {
  close:
    "m249-183-66-66 231-231-231-231 66-66 231 231 231-231 66 66-231 231 231 231-66 66-231-231-231 231Z",
  arrow_outward: "m250-221-67-67 395-395H224v-94h515v514h-95v-353L250-221Z",
  download:
    "M480-322 251-551l68-66 114 114v-323h94v323l114-114 68 66-229 229ZM135-135v-237h94v143h502v-143h95v237H135Z",
  mail: "M55-135v-691h851v691H55Zm425-295L149-653v424h662v-424L480-430Zm0-83 327-218H154l326 218ZM149-653v-78 502-424Z",
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
