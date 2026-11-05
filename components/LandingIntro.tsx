import { EMAIL, RESUME } from "@/lib/site";

/**
 * The landing page's opening: "Hi, I'm Ryker", a line about what I do, and
 * underlined links to the two things a hiring manager came for. Centered and
 * set in Times New Roman, with plenty of white around it.
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
        <em>Based in Utah.</em>
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
