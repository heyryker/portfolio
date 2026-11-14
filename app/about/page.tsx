import type { Metadata } from "next";
import Link from "next/link";
import { CopyEmail } from "@/components/CopyEmail";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { PixelPortrait } from "@/components/PixelPortrait";
import { SiteHeader } from "@/components/SiteHeader";
import { EDUCATION, EMAIL, EXPERIENCE, PROFILES, RESUME, SITE_URL, WEBSITE_ID, absoluteUrl, pageMetadata, person } from "@/lib/site";
import portrait from "@/public/ryker-marble.webp";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Ryker Marble is a senior brand designer and art director in Utah. Experience at Lucid Software and TRON DAO, plus how to get in touch.",
  path: "/about",
  openGraph: { type: "profile", firstName: "Ryker", lastName: "Marble" },
});

const CONTACT = [
  { label: "EMAIL", value: EMAIL, href: `mailto:${EMAIL}` },
  { label: "PHONE", value: "(435) 257-6458", href: "tel:+14352576458" },
  { label: "LINKEDIN", value: "linkedin.com/in/ryker-marble", href: PROFILES.linkedin },
  { label: "GITHUB", value: "github.com/heyryker", href: PROFILES.github },
];

/** A section label, on the 44px rhythm. Inter 500 caps, like the landing name. */
function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="flex h-11 items-center text-sm font-medium tracking-[0.04em] text-muted uppercase">
      {children}
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-svh">
      <JsonLd
        data={{
          "@type": "ProfilePage",
          url: absoluteUrl("/about"),
          name: "About Ryker Marble",
          isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
          mainEntity: person,
        }}
      />
      <div className="bg-graph relative h-[calc(var(--grid-cell)*6)] md:h-[calc(var(--grid-cell)*3)]">
        <SiteHeader />
        {/* A gray pill like the landing's Resume pill, centered on the 44px name row. */}
        <Link
          href="/"
          className="menu-pill absolute top-[22px] left-[184px] h-11! gap-[0.4em] px-4! text-[15px]! md:left-[232px]"
        >
          <Icon name="arrow_back" className="size-[0.9em] text-[#767676]" />
          Back
        </Link>
      </div>

      <main className="mx-auto max-w-[968px] px-[22px] pt-11 pb-22 md:px-11">
        <p className="text-sm font-medium tracking-[0.04em] text-ink uppercase">HEY [I&rsquo;M] RYKER</p>
        <h1 className="mt-5 text-[clamp(32px,5.2vw,56px)] leading-[1.1] font-medium tracking-[-0.02em] text-balance">
          I&rsquo;m a brand designer interested in strategy, craft and art direction.
        </h1>

        <div className="mt-11 grid gap-11 md:grid-cols-[1fr_264px]">
          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              I&rsquo;m a senior brand designer and art director with eight years in brand design. I
              build brand systems and keep them working at scale for enterprise SaaS and Web3 teams.
              Currently at{" "}
              <a
                href="https://lucid.co"
                target="_blank"
                rel="noopener"
                className="underline decoration-grid underline-offset-4 transition-colors hover:marker focus-visible:marker"
              >
                Lucid Software
              </a>
              .
            </p>
            <p>
              I make complex things simple, and I go looking for the idea nobody expected. That&rsquo;s
              how I approach brand guidelines, campaigns, events and the videos that bring them to life.
            </p>
            <p>
              I take work from the first pitch, sometimes straight to the C-suite, to the system other people build
              from: guidelines other teams use on their own, templates an agency can produce at scale and
              storyboards a motion team can run with.
            </p>
            <p>
              Lately I&rsquo;ve taught myself to design with AI: Midjourney backdrops for{" "}
              <Link href="/work/ai-transformation" className="underline decoration-grid underline-offset-4 transition-colors hover:marker focus-visible:marker">
                a film shot on an LED stage
              </Link>
              , and{" "}
              <Link href="/work/this-site" className="underline decoration-grid underline-offset-4 transition-colors hover:marker focus-visible:marker">
                this site
              </Link>
              , built by writing its brand system for an AI agent.
            </p>
            <p className="text-muted">Based in Utah. Open to relocating.</p>
            <div className="flex flex-wrap gap-3 pt-3">
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
          </div>

          {/* Click it: it bursts into pixels and comes back in the meeple colors. */}
          <PixelPortrait
            src={portrait}
            alt="Ryker Marble, smiling slightly at the camera, with tousled reddish-brown hair, a small nose ring and a hoop earring, in a gray tee against a brick wall."
          />
        </div>

        <section aria-labelledby="contact" className="mt-22 scroll-mt-11">
          <SectionLabel id="contact">CONTACT</SectionLabel>
          <dl className="mt-2 divide-y divide-grid border-y border-grid">
            {CONTACT.map(({ label, value, href }) => (
              <div key={label} className="grid items-center gap-x-6 py-3 sm:grid-cols-[120px_1fr]">
                <dt className="text-sm font-medium tracking-[0.04em] text-muted uppercase">{label}</dt>
                <dd className="flex flex-wrap items-center gap-x-4">
                  <a
                    href={href}
                    {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                    className="text-lg underline decoration-grid underline-offset-4 transition-colors hover:marker focus-visible:marker"
                  >
                    {value}
                  </a>
                  {label === "EMAIL" && <CopyEmail email={EMAIL} />}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="experience" className="mt-22">
          <SectionLabel id="experience">EXPERIENCE</SectionLabel>
          <ul className="mt-2 divide-y divide-grid border-y border-grid">
            {EXPERIENCE.map((job) => (
              <li key={job.role + job.org} className="grid gap-x-6 py-3 sm:grid-cols-[1fr_auto]">
                <span>
                  <span className="font-medium">{job.role}</span>, {job.org}
                </span>
                <span className="text-sm leading-6 text-muted tabular-nums">{job.years}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="education" className="mt-22">
          <SectionLabel id="education">EDUCATION</SectionLabel>
          <ul className="mt-2 divide-y divide-grid border-y border-grid">
            <li className="py-3">
              <span className="font-medium">{EDUCATION.school}</span>, {EDUCATION.degrees}
            </li>
          </ul>
        </section>

        {/* TODO(ryker): approve line */}
        <p className="mt-22 text-sm text-muted">
          Designed by Ryker. Animated by five very small coworkers.
        </p>
      </main>
    </div>
  );
}
