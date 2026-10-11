import { EMAIL, RESUME } from "@/lib/site";

/**
 * A few words about Ryker under the headline, for the hiring manager who
 * lands here cold, with buttons for the two things they came for: the resume
 * and an email address. On desktop it sits in the empty corner left of RYKER,
 * with the buttons' bottom edge on RYKER's baseline; on phones it drops below
 * the headline. Placement lives in globals.css under `.landing-blurb`.
 *
 * The email button says "Email me" so it doesn't read as the Email case
 * study in the row below.
 *
 * The meeples walk over the blurb (it sits under their canvas) and cross the
 * buttons on purpose every so often, and both buttons take the color of a
 * meeple on them, like the headline's blue bits. Clicks still reach the
 * buttons: the canvas ignores pointer events.
 */
export function LandingBlurb() {
  return (
    <div className="landing-blurb">
      {/* TODO(ryker): approve line */}
      <p>Brand designer and art director. I build brand systems that stay clear as they scale. Based in Utah.</p>
      <p className="landing-blurb-links">
        {/* Filled in the accent, so a meeple on it recolors the fill, border and all. */}
        <a href={RESUME} target="_blank" rel="noopener" data-meeple-glance="" data-meeple-tint="button" className="landing-button landing-button-primary">
          Resume
        </a>
        {/* Outlined in its text color, so a meeple walking over tints it like [I'M]. */}
        <a href={`mailto:${EMAIL}`} data-meeple-glance="" data-meeple-tint="text" className="landing-button">
          Email me
        </a>
      </p>
    </div>
  );
}
