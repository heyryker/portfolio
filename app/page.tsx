import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { CaseDeck, type CaseCard } from "@/components/CaseDeck";
import { Headline } from "@/components/Headline";
import { LandingBlurb } from "@/components/LandingBlurb";
import { MeepleField } from "@/components/MeepleField";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";
import { CASE_STUDIES, loadCaseStudy } from "@/lib/work";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

export default async function Home() {
  // Each card's image, title and line come from its case study's MDX meta.
  const cards: CaseCard[] = await Promise.all(
    CASE_STUDIES.map(async ({ slug, label }) => {
      const { meta } = await loadCaseStudy(slug);
      const image = meta.hero?.kind === "video" ? meta.hero.poster : meta.hero?.src;
      return { slug, label, title: meta.title, summary: meta.summary, image, alt: meta.hero?.alt ?? "" };
    }),
  );

  return (
    <>
      <div data-meeple-root="" className="bg-graph relative h-svh min-h-[480px] overflow-hidden select-none">
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
        <main className="absolute inset-0">
          <Headline />
          <LandingBlurb />
        </main>
        <MeepleField />
        <div aria-hidden="true" className="case-deck-keepout" />
        <LandingMarker />
      </div>
      <CaseDeck cards={cards} />
    </>
  );
}
