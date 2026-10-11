import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, WEBSITE_ID, pageMetadata, person } from "@/lib/site";
import { CaseStudyNav } from "@/components/CaseStudyNav";
import { Headline } from "@/components/Headline";
import { LandingBlurb } from "@/components/LandingBlurb";
import { MeepleField } from "@/components/MeepleField";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";

export const metadata: Metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

export default function Home() {
  return (
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
      <CaseStudyNav />
      <LandingMarker />
    </div>
  );
}
