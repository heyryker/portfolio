import { EMAIL, RESUME } from "@/lib/site";

/**
 * A few words about Ryker under the headline, for the hiring manager who
 * lands here cold, with the two things they came for: the resume and an
 * email address. On desktop it sits in the empty corner left of RYKER, with
 * its last line on RYKER's baseline; on phones it drops below the headline.
 * The email link says [EMAIL ME] so it doesn't read as the [EMAIL] case
 * study in the row below.
 * Placement lives in globals.css under `.landing-blurb`.
 *
 * The links are blue like [I'M], so a meeple walking over them tints them too.
 */
export function LandingBlurb() {
  return (
    <div className="landing-blurb">
      {/* TODO(ryker): approve line */}
      <p>Brand designer and art director. I build brand systems that stay clear as they scale. Based in Utah.</p>
      <p className="landing-blurb-links">
        <a href={RESUME} target="_blank" rel="noopener" data-meeple-glance="" className="landing-blurb-link">
          <span data-meeple-tint="text" className="transition-colors duration-900">
            [RESUME]
          </span>
        </a>
        <a href={`mailto:${EMAIL}`} data-meeple-glance="" className="landing-blurb-link">
          <span data-meeple-tint="text" className="transition-colors duration-900">
            [EMAIL ME]
          </span>
        </a>
      </p>
    </div>
  );
}
