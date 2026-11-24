import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { RESUME, SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl, pageKeywords, pageMetadata, person } from "@/lib/site";
import { Icon } from "@/components/Icon";
import { NameAndTime } from "@/components/NameAndTime";
import { ProjectCards } from "@/components/ProjectCards";
import { MeepleRelease } from "@/components/MeepleRelease";
import { SiteFooter } from "@/components/SiteFooter";
import { LandingMarker } from "@/components/work/LandingMarker";
import { ABOUT_CARD, getProjectCards } from "@/lib/projects";

/** Project cards shown before "+ More projects", to keep the focus on the main work. */
const FEATURED = 7;

export const metadata: Metadata = pageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
  keywords: pageKeywords(person.jobTitle, "Brand designer", "Creative lead", "Art director", "Portfolio", person.knowsAbout),
});

export default async function Home() {
  const cards = await getProjectCards();

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
            // The landing page is the project list: name every card, so
            // crawlers and answer engines see the whole body of work in one
            // place even though the projects open as overlays.
            {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/#projects`,
              url: SITE_URL,
              name: `${SITE_NAME}: projects`,
              isPartOf: { "@id": WEBSITE_ID },
              about: { "@id": person["@id"] },
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: cards.length,
                itemListElement: cards.map((card, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  item: {
                    "@type": card.href.startsWith("/blog/") ? "BlogPosting" : "CreativeWork",
                    url: absoluteUrl(card.href),
                    name: card.title,
                    description: card.summary,
                    image: absoluteUrl(card.image),
                    ...(card.tags.length && { keywords: card.tags.join(", ") }),
                    creator: { "@id": person["@id"] },
                  },
                })),
              },
            },
          ],
        }}
      />
      <main className="landing">
        <NameAndTime heading />
        <p className="landing-actions">
          <a href={RESUME} target="_blank" rel="noopener" className="menu-pill">
            Resume
            <Icon name="arrow_outward" className="size-[0.9em] text-[#767676]" />
            <span className="sr-only"> (PDF, opens in a new tab)</span>
          </a>
        </p>
        <section aria-label="Projects" className="landing-cards">
          {/* About me on top, then the featured projects; the rest wait behind the pill. */}
          <ProjectCards items={[ABOUT_CARD, ...cards]} initial={FEATURED + 1} />
        </section>
      </main>
      <LandingMarker />
      <SiteFooter />
      <MeepleRelease />
    </div>
  );
}
