import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { LandingIntro } from "@/components/LandingIntro";
import { Showcase, type ShowcaseItem } from "@/components/Showcase";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";
import { getPosts } from "@/lib/blog";
import { CASE_STUDIES, loadCaseStudy } from "@/lib/work";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

const sentenceCase = (label: string) => label.charAt(0) + label.slice(1).toLowerCase();

export default async function Home() {
  // Case studies first, so one tops each column, then the blog, newest first.
  const cases: ShowcaseItem[] = (
    await Promise.all(
      CASE_STUDIES.map(async ({ slug, label }) => {
        const { meta } = await loadCaseStudy(slug);
        const image = meta.hero?.kind === "video" ? meta.hero.poster : meta.hero?.src;
        if (!image) return undefined;
        return {
          href: `/work/${slug}`,
          eyebrow: `Case study · ${sentenceCase(label)}`,
          title: meta.title,
          image,
          alt: meta.hero?.alt ?? "",
        };
      }),
    )
  ).filter((c): c is ShowcaseItem => !!c);

  const posts: ShowcaseItem[] = getPosts().map((p) => ({
    href: `/blog/${p.slug}`,
    eyebrow: `Blog · ${p.date.slice(0, 4)}`,
    title: p.title,
    image: p.cover,
    alt: p.coverAlt,
  }));

  return (
    <div className="relative overflow-x-clip">
      {/* Who this site is about, for search and answer engines. */}
      <JsonLd
        data={{
          "@graph": [
            person,
            {
              "@type": "WebSite",
              "@id": WEBSITE_ID,
              url: SITE_URL,
              name: SITE_NAME,
              description: SITE_DESCRIPTION,
              inLanguage: "en-US",
              publisher: { "@id": person["@id"] },
            },
          ],
        }}
      />
      <SiteHeader />
      <main>
        {/* The cards float around the intro before condensing into the rack. */}
        <Showcase intro={<LandingIntro />} items={[...cases, ...posts]} />
      </main>
      <LandingMarker />
      <SiteFooter />
    </div>
  );
}
