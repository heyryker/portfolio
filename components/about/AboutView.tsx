import Link from "next/link";
import { CopyEmail } from "@/components/CopyEmail";
import { Icon } from "@/components/Icon";
import { ProjectView } from "@/components/project/ProjectView";
import { ImageSlide } from "@/components/project/slides";
import { NextProjectLink } from "@/components/work/NextProjectLink";
import { getProjectCards } from "@/lib/projects";
import { ABOUT_HEADLINE, EDUCATION, EMAIL, EXPERIENCE, PROFILES, RESUME } from "@/lib/site";
import { CASE_STUDIES } from "@/lib/work";

const CONTACT = [
  { label: "Email", value: EMAIL, href: `mailto:${EMAIL}` },
  { label: "Phone", value: "(435) 257-6458", href: "tel:+14352576458" },
  { label: "LinkedIn", value: "linkedin.com/in/ryker-marble", href: PROFILES.linkedin },
  { label: "GitHub", value: "github.com/heyryker", href: PROFILES.github },
];

const p = "case-col my-4 max-w-[660px] text-lg leading-relaxed";
const link = "underline decoration-grid underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:text-accent";
const rows = "case-col max-w-[660px] divide-y divide-[#e2e2e2] border-y border-[#e2e2e2]";

/**
 * About me, opened like any project (components/project/ProjectView.tsx):
 * the portrait in the strip on top, then the same gray panel with the
 * headline, details, bio, contact, experience and education. Renders on
 * /about and in the overlay that slides up from the landing page's first card.
 */
export async function AboutView() {
  const cards = await getProjectCards();
  const first = CASE_STUDIES[0];
  return (
    <ProjectView
      href="/about"
      cards={cards}
      title="About me"
      slides={
        <ImageSlide
          src="/ryker-marble.webp"
          alt="Ryker Marble, smiling slightly at the camera, with tousled reddish-brown hair, a small nose ring and a hoop earring, in a gray tee against a brick wall."
          width={1056}
          height={1320}
          fit="contain"
          priority
        />
      }
      head={
        <>
          <p className="project-eyebrow">About me</p>
          <h1 className="project-title">Ryker Marble</h1>
          <p className="project-summary">{ABOUT_HEADLINE}</p>
          <dl className="project-meta">
            <div>
              <dt>Role</dt>
              <dd>Senior brand designer and art director</dd>
            </div>
            <div>
              <dt>Now</dt>
              <dd>
                <a href="https://lucid.co" target="_blank" rel="noopener" className={link}>
                  Lucid Software
                </a>
              </dd>
            </div>
            <div>
              <dt>Based</dt>
              <dd>Utah. Open to relocating.</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            {/* Gray pills, the same as the landing's Resume pill (.menu-pill). */}
            <a href={RESUME} download="Ryker-Marble-Resume.pdf" className="menu-pill gap-[0.4em]">
              Download resume
              <Icon name="download" className="size-[0.9em] text-[#767676]" />
            </a>
            <a href={RESUME} target="_blank" rel="noopener" className="menu-pill gap-[0.4em]">
              View in browser
              <Icon name="arrow_outward" className="size-[0.9em] text-[#767676]" />
              <span className="sr-only"> (PDF, opens in a new tab)</span>
            </a>
          </div>
        </>
      }
      footer={
        <>
          <NextProjectLink href={`/work/${first.slug}`} label={first.name} kicker="Start with" />
          <p className="project-contact">
            {/* TODO(ryker): approve line */}
            <span>
              Like what you see? I&rsquo;m <a href={`mailto:${EMAIL}`}>one email away</a>.
            </span>
            <CopyEmail email={EMAIL} />
          </p>
        </>
      }
    >
      <p className={p}>
        I&rsquo;m a senior brand designer and art director with eight years in brand design. I build brand
        systems and keep them working at scale for enterprise SaaS and Web3 teams.
      </p>
      <p className={p}>
        I make complex things simple, and I go looking for the idea nobody expected. That&rsquo;s how I
        approach brand guidelines, campaigns, events and the videos that bring them to life.
      </p>
      <p className={p}>
        I take work from the first pitch, sometimes straight to the C-suite, to the system other people build
        from: guidelines other teams use on their own, templates an agency can produce at scale and storyboards
        a motion team can run with.
      </p>
      <p className={p}>
        Lately I&rsquo;ve taught myself to design with AI: Midjourney backdrops for{" "}
        <Link href="/work/ai-transformation" className={link}>
          a film shot on an LED stage
        </Link>
        , and{" "}
        <Link href="/work/this-site" className={link}>
          this site
        </Link>
        , built by writing its brand system for an AI agent.
      </p>

      <h2 className="project-section">Contact</h2>
      <dl className={rows}>
        {CONTACT.map(({ label, value, href }) => (
          <div key={label} className="grid items-center gap-x-6 py-3 sm:grid-cols-[6em_1fr]">
            <dt className="text-[15px] text-[#767676]">{label}</dt>
            <dd className="flex flex-wrap items-center gap-x-4">
              <a href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className={`text-lg ${link}`}>
                {value}
              </a>
              {label === "Email" && <CopyEmail email={EMAIL} />}
            </dd>
          </div>
        ))}
      </dl>

      <h2 className="project-section">Experience</h2>
      <ul className={rows}>
        {EXPERIENCE.map((job) => (
          <li key={job.role + job.org} className="grid gap-x-6 py-3 text-lg sm:grid-cols-[1fr_auto]">
            <span>
              {job.role}, {job.org}
            </span>
            <span className="text-[15px] leading-7 text-[#767676] tabular-nums">{job.years}</span>
          </li>
        ))}
      </ul>

      <h2 className="project-section">Education</h2>
      <ul className={rows}>
        <li className="py-3 text-lg">
          {EDUCATION.school}, {EDUCATION.degrees}
        </li>
      </ul>
    </ProjectView>
  );
}
