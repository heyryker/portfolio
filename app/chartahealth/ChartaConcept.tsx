"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/*
 * Unofficial homepage concept for Charta Health (chartahealth.com), built for
 * an interview. Copy, product screenshots and logo are Charta's own, taken
 * from their live homepage (2026-11). Colors are their Webflow brand tokens:
 *   dark-bg #0f2d29, headings #25413c, accent #3a8363, off-white #f6f1e7,
 *   darker-border #ddd3bf, stroke #e9e2d3, paragraph #5c716d, sand #d9c8bb.
 * Nothing here uses the portfolio's own brand on purpose.
 *
 * "Design notes" (off by default) show numbered callouts explaining what
 * changed from the live page and why.
 */

const SOLUTIONS = [
  {
    id: "coding",
    tab: "Autonomous coding",
    title: "Instant, accurate codes for every encounter",
    body: "Charta reviews all documentation immediately after note submission to completely and accurately code every service.",
    img: "/chartahealth/cpt.avif",
    alt: "Charta autocorrecting an urgent care E/M code from 99212 to 99213 based on documented medical decision making",
  },
  {
    id: "revenue",
    tab: "Revenue discovery",
    title: "End coding-related revenue leaks",
    body: "Charta finds missed revenue by making sure every service delivered is coded, and that E/M codes are billed at the highest defensible level.",
    img: "/chartahealth/revenue-discovery.avif",
    alt: "Revenue discovery dashboard showing RVUs per encounter rising from 1.89 to 2.10, an 11.5% lift",
  },
  {
    id: "compliance",
    tab: "Payer compliance",
    title: "Fix issues while charts are still open",
    body: "Catch coding errors and documentation gaps before billing, not after an audit. Preventable denials and audit exposure go away.",
    img: "/chartahealth/payer-compliance.avif",
    alt: "Documentation compliance dashboard across all providers and sites",
  },
  {
    id: "quality",
    tab: "Clinical quality",
    title: "Quality measures across every encounter",
    body: "Clinical leaders see quality measures and care gaps for every encounter, and providers get automated feedback that improves care and records at the same time.",
    img: "/chartahealth/clinical-quality.avif",
    alt: "Provider performance report showing clinical quality measures",
  },
  {
    id: "risk",
    tab: "Risk adjustment",
    title: "Capture and defend every HCC code",
    body: "Charta surfaces missed risk adjustment opportunities with direct citations to the chart, so reviewers validate faster and at a lower cost per chart.",
    img: "/chartahealth/risk-adjustment.avif",
    alt: "Table of HCC codes added by provider",
  },
];

const PROOF = [
  {
    stat: "90%",
    label: "more pre-bill chart review coverage, with no added headcount",
    quote:
      "Charta identifies unsupported and missing codes, and E/M leveling inconsistencies. We've increased our internal pre-bill review coverage by 90% without additional headcount.",
    name: "Vanessa Miller",
    role: "VP of Revenue Cycle, Family Care Center",
  },
  {
    stat: "90%",
    label: "increase in charts reviewed before billing",
    quote:
      "We didn't even realize it could be this much better. The ability to audit 100% of claims prepayment, prevent denials, and scale efficiently has been a game-changer.",
    name: "Laurie Dotas",
    role: "Chief Operating Officer, Third Eye Health",
  },
  {
    stat: "25%",
    label: "less time spent on clinical management workflow",
    quote:
      "You basically have changed the entire work capabilities of our clinical management team. Nobody wants to sit in an office and do workflow. That's not why people become therapists.",
    name: "Micki Roget",
    role: "Chief Operations Officer, KidsCare Home Health",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect your EHR",
    body: "Charta pulls charts straight from your EHR. A dedicated Charta AI engineer sets up workflows that mirror how your team already works, and keeps tuning them as payer and CMS rules change.",
  },
  {
    n: "02",
    title: "Every note is reviewed at close",
    body: "When a provider closes a note, Charta identifies the encounter type and runs the right coding and quality checks. When it finds an issue, you choose what happens:",
    chips: ["Autocorrect in the EHR", "Notify the provider", "Queue for a human"],
    img: "/chartahealth/step-2.avif",
    alt: "Charta pulling 7,847 charts, identifying a primary care note, running 10 coding and 8 clinical quality analyses, and autocorrecting 99212 to 99213",
  },
  {
    n: "03",
    title: "See it all in one place",
    body: "Revenue capture, quality measures and documentation compliance live in shared dashboards, so every team works from the same numbers.",
    img: "/chartahealth/step-3.avif",
    alt: "Dashboards showing an 11.5% increase in RVUs per encounter and documentation compliance by provider",
  },
];

const ROLES = [
  ["Revenue cycle", "Capture and defend every earned RVU at scale."],
  ["Clinical leadership", "Close the gap between care delivered and care billed."],
  ["Compliance", "Shift from risk mitigation to proactive payer compliance."],
  ["Operations", "Scale patient volume, not back-office headcount."],
  ["Executive", "Stop managing margins. Start scaling them."],
  ["Quality", "Close care gaps with insight into every quality measure."],
];

const RESOURCES = [
  {
    kind: "Webinar",
    title: "Understanding M&A from a CMO's lens: Lessons from Carbon Health",
    body: "Caesar Djavaherian on why revenue quality degrades during rapid growth, even at well-run clinics.",
  },
  {
    kind: "Case study",
    title: "How Guidelight Health expanded across states without losing its level-of-care standards",
    body: "Scaling behavioral health care while keeping clinical quality and compliance consistent.",
  },
  {
    kind: "Insights",
    title: "AI in primary care: How primary care medical groups use AI to protect margins",
    body: "Cutting administrative burden, closing care gaps and stopping revenue leak.",
  },
];

/* Illustrative only: the kind of thing Charta does to a chart at note close. */
const FEED = [
  { enc: "Primary care · established patient", result: "Autocorrected 99212 → 99213", tone: "fix" },
  { enc: "Urgent care · new patient", result: "Coded 99203 · compliant", tone: "ok" },
  { enc: "Dermatology · lesion biopsy", result: "Missed service found · 11102 added", tone: "fix" },
  { enc: "Behavioral health · follow-up", result: "Documentation gap · sent to provider", tone: "flag" },
  { enc: "Primary care · annual wellness", result: "Care gap found · HEDIS measure", tone: "flag" },
  { enc: "Urgent care · established patient", result: "Coded 99214 · compliant", tone: "ok" },
] as const;

const NOTES: Record<number, { title: string; body: string }> = {
  1: {
    title: "Say what it is before asking a question",
    body: "The live hero opens with a hypothetical question. A buyer has to read the subhead to learn what Charta does. The new headline states the promise plainly, and the proof points (11%, 100%, CPC- and CRC-certified engineers) sit in the first screen instead of further down. The small Provider / Payer switch above the headline is gone, so nothing competes with the promise.",
  },
  2: {
    title: "Show the product doing the job",
    body: "The hero visual is a small live feed of charts being reviewed at note close. It explains pre-billing review in about three seconds, without a paragraph. (The encounters in it are illustrative.)",
  },
  3: {
    title: "Customer results right after the promise",
    body: "On the live page the strongest proof (customer quotes with real numbers) is about two-thirds of the way down, in a slider. The first logos under the hero are associations Charta is a member of, which can read as customer logos but aren't. Here the numbers lead and the quotes back them up.",
  },
  4: {
    title: "Lead each product with an outcome",
    body: "The product tour keeps the real screenshots, but each panel now leads with a concrete outcome. For example, payer compliance goes from \u201cGet peace of mind and greater control\u201d to \u201cFix issues while charts are still open.\u201d",
  },
  5: {
    title: "Three steps that scan",
    body: "Each step was two long paragraphs. Now each is one or two sentences, and the 'you decide what happens' choice from step two becomes three chips, since it's a real selling point.",
  },
  6: {
    title: "Roles as a quick list, not stock photos",
    body: "Six photo cards became a two-column list. Visitors find their role and outcome in seconds, and the page is shorter and lighter.",
  },
  7: {
    title: "Lead with people at the close",
    body: "The final ask names the dedicated, certified engineer, the differentiator buried in step one of the live page. Resources drop from six long cards to three short ones.",
  },
};

export function ChartaConcept() {
  const [notes, setNotes] = useState(false);
  const [tab, setTab] = useState(SOLUTIONS[0].id);
  const solution = SOLUTIONS.find((s) => s.id === tab) ?? SOLUTIONS[0];

  return (
    <div className="min-h-svh bg-white font-[family-name:var(--font-charta-sans)] text-[#25413c] antialiased [--charta-serif:var(--font-charta-serif)]">
      <ConceptBar notes={notes} onToggle={() => setNotes((v) => !v)} />
      <Nav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#f6f1e7]">
          <div className="mx-auto grid max-w-[1280px] gap-12 px-5 pt-14 pb-16 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
            <div>
              {notes && <Note n={1} />}
              <p className="mb-5 inline-flex items-center gap-2 border border-[#ddd3bf] bg-white px-3 py-1 text-[13px] font-medium text-[#3a8363]">
                <span className="size-1.5 rounded-full bg-[#3a8363]" aria-hidden="true" />
                AI chart review for providers and payers
              </p>
              <h1 className="font-[family-name:var(--font-charta-serif)] text-[44px] leading-[1.05] tracking-[-0.02em] text-[#25413c] md:text-[64px]">
                Every chart reviewed <em className="text-[#3a8363]">before</em> it&rsquo;s billed.
              </h1>
              <p className="mt-6 max-w-[520px] text-[18px] leading-[1.55] text-[#5c716d]">
                Charta checks 100% of patient encounters for coding accuracy, missed revenue and payer compliance, so
                your team only touches the charts that need a human.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button>Request a demo</Button>
                <Button variant="ghost" href="#how">
                  See how it works
                </Button>
              </div>
              <dl className="mt-12 grid max-w-[540px] grid-cols-3 gap-4 border-t border-[#ddd3bf] pt-6">
                <Stat value="11%" label="average revenue uplift" />
                <Stat value="100%" label="of encounters reviewed pre-bill" />
                <Stat value="CPC & CRC" label="certified engineers on your team" small />
              </dl>
            </div>
            <div>
              {notes && <Note n={2} />}
              <ReviewFeed />
            </div>
          </div>
        </section>

        {/* Proof */}
        <section className="bg-[#0f2d29] text-white">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-24">
            {notes && <Note n={3} dark />}
            <h2 className="max-w-[640px] font-[family-name:var(--font-charta-serif)] text-[34px] leading-[1.1] tracking-[-0.02em] md:text-[44px]">
              Teams review more charts without hiring more reviewers.
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden bg-white/10 md:grid-cols-3">
              {PROOF.map((p) => (
                <figure key={p.name} className="flex flex-col bg-[#0f2d29] p-7 md:p-8">
                  <p className="font-[family-name:var(--font-charta-serif)] text-[64px] leading-none tracking-[-0.03em] text-[#9cc1b1]">
                    {p.stat}
                  </p>
                  <p className="mt-2 text-[15px] text-white/80">{p.label}</p>
                  <blockquote className="mt-8 flex-1 text-[15px] leading-[1.6] text-white/70">&ldquo;{p.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 border-t border-white/10 pt-4 text-[14px]">
                    <span className="font-semibold text-white">{p.name}</span>
                    <br />
                    <span className="text-[#d9c8bb]">{p.role}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-10 text-[13px] tracking-[0.06em] text-white/50 uppercase">
              Member of HFMA, MGMA and other healthcare associations
            </p>
          </div>
        </section>

        {/* Solutions */}
        <section className="bg-[#f6f1e7]">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-24">
            {notes && <Note n={4} />}
            <SectionHead
              eyebrow="Platform"
              title="One review, five ways to protect the practice"
              body="Charta's AI engineers customize every integration for provider organizations, health systems, payers and MSOs."
            />
            <div role="tablist" aria-label="Solutions" className="mt-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {SOLUTIONS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  id={`tab-${s.id}`}
                  aria-selected={tab === s.id}
                  aria-controls="solution-panel"
                  onClick={() => setTab(s.id)}
                  className={`shrink-0 px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a8363] ${
                    tab === s.id ? "bg-[#25413c] text-white" : "bg-white text-[#25413c] hover:bg-[#e9e2d3]"
                  }`}
                >
                  {s.tab}
                </button>
              ))}
            </div>
            <div
              id="solution-panel"
              role="tabpanel"
              aria-labelledby={`tab-${solution.id}`}
              className="mt-6 grid gap-8 border border-[#ddd3bf] bg-white p-6 md:p-10 lg:grid-cols-[1fr_1.25fr] lg:items-center"
            >
              <div>
                <h3 className="font-[family-name:var(--font-charta-serif)] text-[30px] leading-[1.15] tracking-[-0.01em] md:text-[36px]">
                  {solution.title}
                </h3>
                <p className="mt-4 text-[17px] leading-[1.6] text-[#5c716d]">{solution.body}</p>
                <a href="#" className="mt-6 inline-flex items-center gap-1 font-semibold text-[#3a8363] hover:underline">
                  Learn about {solution.tab.toLowerCase()} <span aria-hidden="true">→</span>
                </a>
              </div>
              <div className="overflow-hidden border border-[#e9e2d3] bg-[#f6f1e7]">
                <Image
                  key={solution.img}
                  src={solution.img}
                  alt={solution.alt}
                  width={1000}
                  height={800}
                  className="h-auto w-full"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-24">
            {notes && <Note n={5} />}
            <SectionHead
              eyebrow="How Charta works"
              title="Live in your EHR, reviewing from the first note"
              body="Charta builds customized AI models and dashboards with provider groups, payers, MSOs and other healthcare organizations."
            />
            <ol className="mt-12 grid gap-6 lg:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex flex-col border border-[#e9e2d3] bg-[#f6f1e7] p-6 md:p-8">
                  <span className="font-[family-name:var(--font-charta-serif)] text-[20px] text-[#3a8363]">{s.n}</span>
                  <h3 className="mt-3 text-[22px] leading-[1.25] font-semibold tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-3 text-[16px] leading-[1.6] text-[#5c716d]">{s.body}</p>
                  {s.chips && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {s.chips.map((c) => (
                        <li key={c} className=" border border-[#ddd3bf] bg-white px-3 py-1 text-[13px] font-medium">
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.img ? (
                    <div className="mt-6 overflow-hidden border border-[#e9e2d3] bg-white">
                      <Image src={s.img} alt={s.alt ?? ""} width={1312} height={1312} className="h-auto w-full" unoptimized />
                    </div>
                  ) : (
                    <EhrVisual />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles */}
        <section className="bg-[#f6f1e7]">
          <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-20 md:px-10 md:py-24 lg:grid-cols-[1fr_1.4fr]">
            <div>
              {notes && <Note n={6} />}
              <SectionHead
                eyebrow="Built for"
                title="Teams across your practice"
                body="Provider organizations use Charta to grow revenue and build scalable systems for payer compliance, provider performance and clinical quality."
              />
            </div>
            <ul className="grid gap-px overflow-hidden border border-[#ddd3bf] bg-[#ddd3bf] sm:grid-cols-2">
              {ROLES.map(([role, line]) => (
                <li key={role}>
                  <a href="#" className="group flex h-full flex-col bg-white p-6 transition-colors hover:bg-[#fbf8f2]">
                    <span className="flex items-center justify-between text-[17px] font-semibold">
                      {role}
                      <span aria-hidden="true" className="text-[#3a8363] transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </span>
                    <span className="mt-2 text-[15px] leading-[1.5] text-[#5c716d]">{line}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Resources + CTA */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-10 md:py-24">
            {notes && <Note n={7} />}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHead eyebrow="Resources" title="Learn from teams already doing it" />
              <a href="#" className="font-semibold text-[#3a8363] hover:underline">
                Browse all resources →
              </a>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {RESOURCES.map((r) => (
                <a
                  key={r.title}
                  href="#"
                  className="group flex flex-col border border-[#e9e2d3] p-6 transition-colors hover:border-[#ddd3bf] hover:bg-[#f6f1e7]"
                >
                  <span className="text-[12px] font-semibold tracking-[0.08em] text-[#3a8363] uppercase">{r.kind}</span>
                  <span className="mt-3 font-[family-name:var(--font-charta-serif)] text-[22px] leading-[1.25]">{r.title}</span>
                  <span className="mt-3 text-[15px] leading-[1.55] text-[#5c716d]">{r.body}</span>
                </a>
              ))}
            </div>

            <div className="mt-20 grid gap-8 overflow-hidden bg-[#0f2d29] p-8 text-white md:p-14 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <h2 className="font-[family-name:var(--font-charta-serif)] text-[36px] leading-[1.1] tracking-[-0.02em] md:text-[48px]">
                  Talk to the engineer who&rsquo;ll build your setup.
                </h2>
                <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-white/70">
                  Every Charta customer gets a dedicated, CPC- and CRC-certified AI engineer, from the first demo through
                  every payer and CMS rule change after launch.
                </p>
              </div>
              <div className="flex flex-col gap-3 lg:items-end">
                <Button light>Request a demo</Button>
                <span className="text-[14px] text-white/50">Or log in to the client portal</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ConceptBar({ notes, onToggle }: { notes: boolean; onToggle: () => void }) {
  return (
    <div className="relative z-40 bg-[#d9c8bb] text-[#0f2d29]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-5 py-2 text-[13px] md:px-10">
        <p>
          <strong className="font-semibold">Unofficial concept</strong>
          <span className="hidden sm:inline">
            {" "}
            · A homepage redesign by{" "}
            <Link href="/" className="underline underline-offset-2">
              Ryker Marble
            </Link>
            . Not affiliated with Charta Health.
          </span>
        </p>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={notes}
          className="flex shrink-0 items-center gap-2 bg-[#0f2d29] px-3 py-1 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f2d29]"
        >
          <span
            aria-hidden="true"
            className={`relative h-3.5 w-6 transition-colors ${notes ? "bg-[#9cc1b1]" : "bg-white/25"}`}
          >
            <span
              className={`absolute top-0.5 size-2.5 bg-white transition-[left] ${notes ? "left-3" : "left-0.5"}`}
            />
          </span>
          Design notes
        </button>
      </div>
    </div>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-[#0f2d29] text-white">
      <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-10">
          <a href="#" aria-label="Charta home">
            <Image src="/chartahealth/logo.svg" alt="Charta" width={127} height={36} priority className="brightness-0 invert" unoptimized />
          </a>
          <nav aria-label="Main" className="hidden items-center gap-7 text-[15px] lg:flex">
            {["Platform", "Solutions", "Customers", "Resources", "Company"].map((l) => (
              <a key={l} href="#" className="text-white/85 hover:text-[#fdff72]">
                {l}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hidden text-[15px] text-white/85 hover:text-[#fdff72] md:inline">
            Client login
          </a>
          <Button small>Request a demo</Button>
          <button
            type="button"
            className="grid size-10 place-items-center hover:bg-white/10 lg:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="h-0.5 w-5 bg-white" />
              <span className="h-0.5 w-5 bg-white" />
            </span>
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Main" className="border-t border-white/10 px-5 py-4 lg:hidden">
          {["Platform", "Solutions", "Customers", "Resources", "Company", "Client login"].map((l) => (
            <a key={l} href="#" className="block py-2 text-[17px]">
              {l}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function Button({
  children,
  href = "#",
  variant = "solid",
  small,
  light,
}: {
  children: ReactNode;
  href?: string;
  variant?: "solid" | "ghost";
  small?: boolean;
  light?: boolean;
}) {
  const size = small ? "px-4 py-2 text-[14px] max-sm:hidden" : "px-6 py-3 text-[16px]";
  const look = light
    ? "bg-[#fdff72] text-[#0f2d29] hover:bg-[#f0f25a]"
    : variant === "ghost"
      ? "border border-[#ddd3bf] bg-white text-[#25413c] hover:border-[#3a8363]"
      : "bg-[#fdff72] text-[#0f2d29] hover:bg-[#f0f25a] ring-1 ring-inset ring-[#0f2d29]/10";
  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3a8363] ${size} ${look}`}
    >
      {children}
    </a>
  );
}

function Stat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd
        className={`font-[family-name:var(--font-charta-serif)] leading-none tracking-[-0.02em] text-[#25413c] ${
          small ? "pt-1.5 text-[22px] md:text-[26px]" : "text-[34px] md:text-[40px]"
        }`}
      >
        {value}
      </dd>
      <dd aria-hidden="true" className="mt-2 text-[13px] leading-[1.35] text-[#5c716d]">
        {label}
      </dd>
    </div>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-[640px]">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-[#3a8363] uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-[family-name:var(--font-charta-serif)] text-[34px] leading-[1.1] tracking-[-0.02em] md:text-[44px]">
        {title}
      </h2>
      {body && <p className="mt-4 text-[17px] leading-[1.6] text-[#5c716d]">{body}</p>}
    </div>
  );
}

/* The hero visual: notes arriving at close and getting reviewed, one by one. */
function ReviewFeed() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setTick((t) => t + 1);
    }, 1800);
    return () => window.clearInterval(id);
  }, []);
  const rows = Array.from({ length: 5 }, (_, i) => ({ ...FEED[(tick + i) % FEED.length], key: tick + i }));
  return (
    <div className="relative">
      <div className=" border border-[#ddd3bf] bg-white p-5 shadow-[0_30px_60px_-30px_rgba(15,45,41,0.35)] md:p-6">
        <div className="flex items-center justify-between border-b border-[#e9e2d3] pb-4">
          <div>
            <p className="text-[13px] text-[#5c716d]">Notes closed today</p>
            <p className="font-[family-name:var(--font-charta-serif)] text-[28px] leading-tight tabular-nums">
              {(1284 + tick).toLocaleString()} reviewed
            </p>
          </div>
          <span className="flex items-center gap-2 bg-[#e9e2d3] px-3 py-1 text-[13px] font-medium text-[#3a8363]">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#3a8363] opacity-60 motion-reduce:hidden" />
              <span className="relative size-2 rounded-full bg-[#3a8363]" />
            </span>
            Live
          </span>
        </div>
        <ul className="mt-2" aria-label="Example chart reviews">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className={`flex items-center justify-between gap-4 border-b border-[#efe9dc] py-3.5 last:border-0 ${
                i === 0 ? "animate-[charta-in_500ms_ease-out]" : ""
              }`}
              style={{ opacity: 1 - i * 0.14 }}
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium">{r.enc}</span>
                <span className="text-[13px] text-[#5c716d]">Reviewed at note close</span>
              </span>
              <Badge tone={r.tone}>{r.result}</Badge>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-center text-[12px] text-[#5c716d]">Illustrative encounters</p>
      <style>{`@keyframes charta-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}

function Badge({ tone, children }: { tone: "ok" | "fix" | "flag"; children: ReactNode }) {
  const look =
    tone === "ok"
      ? "bg-[#e9e2d3] text-[#25413c]"
      : tone === "fix"
        ? "bg-[#3a8363] text-white"
        : "bg-[#f6ede6] text-[#7a4b2a]";
  return <span className={`shrink-0 px-3 py-1 text-right text-[12px] font-medium sm:text-[13px] ${look}`}>{children}</span>;
}

/* Step one has no product screenshot on the live site, so it gets a simple EHR → Charta diagram. */
function EhrVisual() {
  return (
    <div
      className="mt-6 flex flex-1 items-center justify-center gap-3 border border-[#e9e2d3] bg-white p-8"
      aria-hidden="true"
    >
      <span className=" border border-[#ddd3bf] px-4 py-3 text-[14px] font-semibold">Your EHR</span>
      <span className="flex items-center gap-1 text-[#3a8363]">
        <span className="h-px w-8 bg-[#3a8363]" />→
      </span>
      <span className="flex items-center gap-2 bg-[#0f2d29] px-4 py-3 text-[14px] font-semibold text-white">
        <Image src="/chartahealth/logo.svg" alt="" width={60} height={17} className="brightness-0 invert" unoptimized />
      </span>
    </div>
  );
}

function Note({ n, dark }: { n: number; dark?: boolean }) {
  const note = NOTES[n];
  return (
    <aside
      className={`mb-6 flex max-w-[560px] gap-3 border p-4 text-[14px] leading-[1.5] ${
        dark ? "border-[#d9c8bb]/40 bg-[#d9c8bb]/10 text-white/85" : "border-[#d9c8bb] bg-[#fffdf8] text-[#25413c]"
      }`}
    >
      <span className="grid size-6 shrink-0 place-items-center bg-[#d9c8bb] text-[12px] font-bold text-[#0f2d29]">
        {n}
      </span>
      <span>
        <strong className="block font-semibold">{note.title}</strong>
        {note.body}
      </span>
    </aside>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0f2d29] text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(4,1fr)] md:px-10">
        <div>
          <Image src="/chartahealth/logo.svg" alt="Charta" width={113} height={32} className="brightness-0 invert" unoptimized />
          <p className="mt-4 max-w-[260px] text-[14px] text-white/60">AI chart review for a better healthcare system.</p>
        </div>
        {[
          ["Providers", ["Autonomous coding", "Revenue discovery", "Payer compliance", "Clinical quality"]],
          ["Payers", ["Risk adjustment", "Second-pass & QA", "RADV & audits", "HEDIS & quality"]],
          ["Resources", ["Case studies", "Webinars", "Blog", "Tools"]],
          ["Company", ["About", "Careers", "Contact", "Client login"]],
        ].map(([head, links]) => (
          <div key={head as string}>
            <p className="text-[13px] font-semibold tracking-[0.06em] text-[#d9c8bb] uppercase">{head}</p>
            <ul className="mt-4 space-y-2 text-[14px] text-white/70">
              {(links as string[]).map((l) => (
                <li key={l}>
                  <a href="#" className="hover:text-white">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1280px] px-5 py-6 text-[12px] text-white/50 md:px-10">
          Unofficial concept by Ryker Marble. Charta name, logo, copy and product images belong to Charta Health.
        </p>
      </div>
    </footer>
  );
}
