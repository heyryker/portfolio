import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { NameAndTime } from "@/components/NameAndTime";
import { ProjectCards } from "@/components/ProjectCards";
import { SiteMenu } from "@/components/SiteMenu";
import { SiteFooter } from "@/components/SiteFooter";
import { LandingMarker } from "@/components/work/LandingMarker";
import { getProjectCards } from "@/lib/projects";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

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
          ],
        }}
      />
      <header className="landing-top">
        <SiteMenu />
      </header>
      <main className="landing">
        <NameAndTime heading />
        <section aria-label="Projects" className="landing-cards">
          <ProjectCards items={cards} />
        </section>
      </main>
      <LandingMarker />
      <SiteFooter />
    </div>
  );
}
