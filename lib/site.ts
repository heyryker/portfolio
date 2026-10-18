import type { Metadata } from "next";

/*
 * Who Ryker is, in one place: page metadata, the JSON-LD structured data,
 * the sitemap and /llms.txt all read from here, so search engines and answer
 * engines get the same facts the pages show.
 */

export const SITE_URL = "https://heyryker.com";
export const SITE_NAME = "Ryker Marble";
export const SITE_TITLE = "Ryker Marble: Brand & Creative Lead";
export const SITE_DESCRIPTION =
  "Ryker Marble is a brand and creative lead in Utah, working across strategy, craft and art direction for B2B SaaS, cybersecurity, Web3 and fintech brands.";

export const OG_IMAGE_ALT = "HEY [I'M] RYKER. Ryker Marble, brand and creative lead.";

export const EMAIL = "rykermarble@gmail.com";
export const RESUME = "/resume/ryker-marble-resume.pdf";

/*
 * Google Analytics 4 measurement ID (G-…). It's public by design (it ships in
 * every page), so it lives here rather than in a Vercel env var. Empty means
 * no GA tag at all; Vercel Analytics keeps running either way.
 */
export const GA_MEASUREMENT_ID = "G-7S7BW2B19M";

// From Ryker's resume (public/resume/ryker-marble-resume.pdf).
export const EXPERIENCE = [
  { role: "Senior Brand Designer", org: "Lucid Software", years: "2022–present" },
  { role: "Contract Brand Designer", org: "TRON DAO", years: "2025–2026" },
  { role: "Brand Designer", org: "Impact Suite", years: "2021–2022" },
  { role: "Visual Designer", org: "USU STARS! GEAR UP", years: "2018–2021" },
  // The brief lists 2017–present; the resume gives no dates.
  { role: "Freelance Designer", org: "TruFru, GSBS Architects, SixFifty", years: "2017–present" },
  { role: "Co-Director of Programming", org: "AIGA Salt Lake City (volunteer)", years: "2021–2023" },
];

export const EDUCATION = {
  school: "Utah State University",
  degrees: "BFA, Graphic Design; BS, Political Science and Government; minor in Art History",
};

export const PROFILES = {
  linkedin: "https://www.linkedin.com/in/ryker-marble/",
  github: "https://github.com/heyryker",
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

/**
 * Per-page metadata with a canonical URL and matching Open Graph and Twitter
 * fields. Next replaces (rather than merges) a parent's `openGraph` object, so
 * every page builds the whole thing here instead of repeating it.
 */
export function pageMetadata({
  title,
  description,
  path,
  openGraph,
}: {
  /** Leave out for the home page, which uses the full site title. */
  title?: string;
  description: string;
  path: string;
  openGraph?: Metadata["openGraph"];
}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_TITLE;
  // A page's openGraph also hides the share card from app/opengraph-image.tsx,
  // so point at it explicitly. Pages with their own image pass `images`.
  const card = { url: "/opengraph-image", width: 1200, height: 630, alt: OG_IMAGE_ALT };
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
      images: [card],
      ...openGraph,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [card] },
  };
}

/** The Person every page's structured data describes. Same @id everywhere, so parsers merge them. */
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const person = {
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "Ryker Marble",
  url: SITE_URL,
  image: absoluteUrl("/ryker-marble.jpg"),
  jobTitle: "Senior Brand Designer",
  description:
    "Senior brand designer and art director who builds brand systems and keeps them working at scale for enterprise SaaS and Web3 teams.",
  email: `mailto:${EMAIL}`,
  worksFor: { "@type": "Organization", name: "Lucid Software", url: "https://lucid.co" },
  alumniOf: { "@type": "CollegeOrUniversity", name: EDUCATION.school },
  address: { "@type": "PostalAddress", addressRegion: "UT", addressCountry: "US" },
  knowsAbout: [
    "Brand design",
    "Brand strategy",
    "Brand guidelines",
    "Art direction",
    "Motion design art direction",
    "Event identity",
    "Email design",
    "Editorial design",
  ],
  sameAs: [PROFILES.linkedin, PROFILES.github],
} as const;
