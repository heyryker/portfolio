import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { LandingIntro } from "@/components/LandingIntro";
import type { ShowcaseItem } from "@/components/Showcase";
import { WorkSection } from "@/components/WorkSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";
import { getPosts } from "@/lib/blog";
import { CASE_STUDIES, loadCaseStudy } from "@/lib/work";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

export default async function Home() {
  // The case studies lead; the carousel has them first, then the blog, newest first.
  const cases: ShowcaseItem[] = (
    await Promise.all(
      CASE_STUDIES.map(async ({ slug, name, area }): Promise<ShowcaseItem | undefined> => {
        const { meta } = await loadCaseStudy(slug);
        const image = meta.hero?.kind === "video" ? meta.hero.poster : meta.hero?.src;
        if (!image) return undefined;
        return {
          href: `/work/${slug}`,
          title: meta.title,
          image,
          alt: meta.hero?.alt ?? "",
          summary: meta.summary,
          name,
          area,
        };
      }),
    )
  ).filter((c): c is ShowcaseItem => !!c);

  const posts: ShowcaseItem[] = getPosts().map((p) => ({
    href: `/blog/${p.slug}`,
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
      <SiteHeader sticky />
      <main>
        <LandingIntro />
        <WorkSection cases={cases} all={[...cases, ...posts]} />
      </main>
      <LandingMarker />
      <SiteFooter />
    </div>
  );
}
