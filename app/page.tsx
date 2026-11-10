import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { LandingIntro } from "@/components/LandingIntro";
import { ProjectFeed, type FeedItem } from "@/components/ProjectFeed";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";
import { getPosts } from "@/lib/blog";
import { CASE_STUDIES, loadCaseStudy } from "@/lib/work";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

export default async function Home() {
  // The case studies lead the feed, then the blog, newest first.
  const cases: FeedItem[] = (
    await Promise.all(
      CASE_STUDIES.map(async ({ slug, name, area }): Promise<FeedItem | undefined> => {
        const { meta } = await loadCaseStudy(slug);
        const image = meta.hero?.kind === "video" ? meta.hero.poster : meta.hero?.src;
        if (!image) return undefined;
        return {
          href: `/work/${slug}`,
          image,
          alt: meta.hero?.alt ?? "",
          name,
          detail: area,
        };
      }),
    )
  ).filter((c): c is FeedItem => !!c);

  const posts: FeedItem[] = getPosts().map((p) => ({
    href: `/blog/${p.slug}`,
    image: p.cover,
    alt: p.coverAlt,
    name: p.title,
    detail: `Blog, ${p.date.slice(0, 4)}`,
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
        <ProjectFeed items={[...cases, ...posts]} />
      </main>
      <LandingMarker />
      <SiteFooter />
    </div>
  );
}
