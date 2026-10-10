import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CopyEmail } from "@/components/CopyEmail";
import { Meeple } from "@/components/Meeple";
import { PixelSquare } from "@/components/PixelSquare";
import { SiteHeader } from "@/components/SiteHeader";
import portrait from "@/public/ryker-marble.jpg";

export const metadata: Metadata = {
  title: "About",
  description:
    "Ryker Marble is a senior brand designer and art director in Utah. Experience at Lucid Software and TRON DAO, plus how to get in touch.",
};

const EMAIL = "rykermarble@gmail.com";
const RESUME = "/resume/ryker-marble-resume.pdf";

// From Ryker's resume (public/resume/ryker-marble-resume.pdf).
const EXPERIENCE = [
  { role: "Senior Brand Designer", org: "Lucid Software", years: "2022–present" },
  { role: "Contract Brand Designer", org: "TRON DAO", years: "2025–2026" },
  { role: "Brand Designer", org: "Impact Suite", years: "2021–2022" },
  { role: "Visual Designer", org: "USU STARS! GEAR UP", years: "2018–2021" },
  // The brief lists 2017–present; the resume gives no dates.
  { role: "Freelance Designer", org: "TruFru, GSBS Architects, SixFifty", years: "2017–present" },
  { role: "Co-Director of Programming", org: "AIGA Salt Lake City (volunteer)", years: "2021–2023" },
];

const CONTACT = [
  { label: "EMAIL", value: EMAIL, href: `mailto:${EMAIL}` },
  { label: "PHONE", value: "(435) 257-6458", href: "tel:+14352576458" },
  { label: "LINKEDIN", value: "linkedin.com/in/ryker-marble", href: "https://www.linkedin.com/in/ryker-marble/" },
  { label: "GITHUB", value: "github.com/heyryker", href: "https://github.com/heyryker" },
];

/** A bracketed section label with a pixel-square marker, on the 44px rhythm. */
function SectionLabel({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <h2 id={id} className="flex h-11 items-center gap-3 text-sm tracking-[0.08em] text-muted uppercase">
      <PixelSquare className="size-[7px]" />[{children}]
    </h2>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-svh">
      {/* The grid stays in the header only, so it never fights the text (§3). */}
      <div className="bg-graph relative h-[calc(var(--grid-cell)*4)] md:h-[calc(var(--grid-cell)*3)]">
        <SiteHeader />
        <Link
          href="/"
          className="absolute -mx-2 -my-1 bg-bg px-2 py-1 top-[calc(var(--grid-cell)*2.5)] left-[22px] text-sm tracking-[0.08em] text-muted uppercase transition-colors hover:text-ink focus-visible:text-ink md:top-[33px] md:left-[88px]"
        >
          [&larr; BACK]
        </Link>
        {/* Two meeples peeking over the header's bottom edge. */}
        <div aria-hidden="true" className="absolute right-[88px] bottom-0 flex items-end gap-[11px] overflow-hidden max-md:right-[110px]">
          <Meeple color="var(--color-meeple-purple)" className="translate-y-[22px]" />
          <Meeple color="var(--color-meeple-blue)" className="translate-y-[11px]" />
        </div>
      </div>

      <main className="mx-auto max-w-[968px] px-[22px] pt-11 pb-22 md:px-11">
        <p className="text-sm tracking-[0.08em] text-accent uppercase">HEY [I&rsquo;M] RYKER</p>
        <h1 className="mt-5 text-[clamp(32px,5.2vw,56px)] leading-[1.05] font-extrabold tracking-[-0.015em] text-balance">
          I&rsquo;m a brand designer interested in strategy, craft and art direction.
        </h1>

        <div className="mt-11 grid gap-11 md:grid-cols-[1fr_264px]">
          <div className="space-y-4 text-lg leading-relaxed">
            {/* TODO(ryker): approve or rewrite the bio. Drafted from your resume summary. */}
            <p>
              I&rsquo;m a senior brand designer and art director. I build brand systems and keep them
              working at scale, for enterprise SaaS and Web3 teams. Right now that&rsquo;s at Lucid Software, and
              recently as a contract designer for TRON DAO.
            </p>
            <p>
              Most of my work is turning complex, sometimes regulated subject matter into visual systems
              people can actually use: guidelines, campaigns, events and the videos that go with them.
            </p>
            <p className="text-muted">Based in Utah.</p>
            <div className="flex flex-wrap gap-3 pt-3">
              <a
                href={RESUME}
                download="Ryker-Marble-Resume.pdf"
                className="inline-flex h-11 items-center bg-accent px-5 text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:bg-ink focus-visible:bg-ink"
              >
                Download PDF
              </a>
              <a
                href={RESUME}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center border border-ink px-5 text-sm font-semibold tracking-[0.08em] uppercase transition-colors hover:border-accent hover:text-accent focus-visible:text-accent"
              >
                View in browser
              </a>
            </div>
          </div>

          <div className="relative aspect-[4/5] w-full max-w-[264px] overflow-hidden border border-grid">
            <Image
              src={portrait}
              alt="Ryker Marble, in a denim shirt over a white tee, looking off to the side. Black and white."
              fill
              priority
              sizes="264px"
              placeholder="blur"
              className="object-cover object-[50%_30%]"
            />
          </div>
        </div>

        <section aria-labelledby="contact" className="mt-22 scroll-mt-11">
          <SectionLabel id="contact">CONTACT</SectionLabel>
          <dl className="mt-2 divide-y divide-grid border-y border-grid">
            {CONTACT.map(({ label, value, href }) => (
              <div key={label} className="grid items-center gap-x-6 py-3 sm:grid-cols-[120px_1fr]">
                <dt className="text-sm tracking-[0.08em] text-muted uppercase">[{label}]</dt>
                <dd className="flex flex-wrap items-center gap-x-4">
                  <a
                    href={href}
                    {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                    className="text-lg underline decoration-grid underline-offset-4 transition-colors hover:text-accent hover:decoration-accent focus-visible:text-accent"
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
                  <span className="font-semibold">{job.role}</span>, {job.org}
                </span>
                <span className="font-pixel text-xs leading-6 text-muted">{job.years}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="education" className="mt-22">
          <SectionLabel id="education">EDUCATION</SectionLabel>
          <ul className="mt-2 divide-y divide-grid border-y border-grid">
            <li className="py-3">
              <span className="font-semibold">Utah State University</span>, BFA, Graphic Design; BS, Political
              Science and Government; minor in Art History
            </li>
          </ul>
        </section>

        {/* TODO(ryker): approve line */}
        <p className="mt-22 font-pixel text-xs text-muted">
          Designed by Ryker. Animated by five very small coworkers.
        </p>
      </main>
    </div>
  );
}
