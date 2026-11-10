import { EMAIL, RESUME } from "@/lib/site";

/**
 * The landing page's opening: "Hi, I'm Ryker", a line about what I do, and
 * underlined links to the two things a hiring manager came for. Left-aligned on
 * the page margin and set in Times New Roman, above the project feed.
 * Styles live in globals.css under `.landing-intro`.
 */
export function LandingIntro() {
  return (
    <div className="landing-intro">
      <h1 id="landing-intro-title" className="landing-intro-title">Hi, I’m Ryker</h1>
      {/* TODO(ryker): approve line */}
      <p className="landing-intro-blurb">
        Brand designer and art director.
        <br />
        I build brand systems that stay clear as they scale.
        <br />
        {/* Hover (or tap/focus) swaps it for the footnote. Both lines share one
            grid cell, so the swap doesn't shift anything; screen readers get
            both from the sr-only text. */}
        <em className="landing-intro-place" tabIndex={0}>
          <span className="sr-only">Based in Utah. Willing to relocate.</span>
          <span aria-hidden="true" className="landing-intro-place-home">
            Based in Utah.*
          </span>
          <span aria-hidden="true" className="landing-intro-place-move">
            *Willing to relocate.
          </span>
        </em>
      </p>
      <p className="landing-intro-links">
        <a href={RESUME} target="_blank" rel="noopener">
          Resume
        </a>
        <a href={`mailto:${EMAIL}`}>Email me</a>
      </p>
    </div>
  );
}
