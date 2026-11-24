import type { Metadata } from "next";
import { AboutView } from "@/components/about/AboutView";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, WEBSITE_ID, absoluteUrl, pageMetadata, person } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "Ryker Marble is a senior brand designer and art director in Utah. Experience at Lucid Software and TRON DAO, plus how to get in touch.",
  path: "/about",
  openGraph: { type: "profile", firstName: "Ryker", lastName: "Marble" },
});

/** About me on its own URL, in the same project view the landing card opens. */
export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={{
          "@type": "ProfilePage",
          url: absoluteUrl("/about"),
          name: "About Ryker Marble",
          isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
          mainEntity: person,
        }}
      />
      <AboutView />
    </>
  );
}
