import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { caseStudySource, imageObject, mediaInSource, videoObject } from "@/lib/media";
import { CaseStudy } from "@/components/work/CaseStudy";
import { WipeOnLeave } from "@/components/work/WipeOnLeave";
import { SITE_NAME, SITE_URL, WEBSITE_ID, absoluteUrl, pageKeywords, pageMetadata, person } from "@/lib/site";
import { CASE_STUDIES, caseStudyLabel, isCaseStudy, loadCaseStudy, type CaseStudyMeta } from "@/lib/work";

/*
 * A case study on its own URL: what a shared link or a refresh opens. It loads
 * without the wipe. Clicking a case study inside the site opens the same
 * content over the current page instead (app/@work/(.)work/[slug]).
 */

export function generateStaticParams() {
  return CASE_STUDIES.map(({ slug }) => ({ slug }));
}

/** The hero still for share cards and structured data: the image, or a video's poster. */
function heroImage(hero: CaseStudyMeta["hero"]) {
  const src = hero?.kind === "video" ? hero.poster : hero?.src;
  return src && !src.startsWith("TODO") ? src : undefined;
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isCaseStudy(slug)) return {};
  const { meta } = await loadCaseStudy(slug);
  const image = heroImage(meta.hero);
  const tags = meta.tags ?? [];
  return pageMetadata({
    title: meta.seoTitle ?? meta.title,
    description: meta.summary,
    path: `/work/${slug}`,
    keywords: pageKeywords(tags, meta.client.split(", "), "Case study"),
    openGraph: {
      type: "article",
      authors: [SITE_URL],
      tags,
      ...(image && { images: [{ url: image, alt: meta.hero?.alt }] }),
    },
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  if (!isCaseStudy(slug)) notFound();
  const { meta } = await loadCaseStudy(slug);
  const url = absoluteUrl(`/work/${slug}`);
  const image = heroImage(meta.hero);
  const { images, videos } = mediaInSource(caseStudySource(slug));
  // Leave TODO placeholders out of the structured data.
  const known = (value: string) => (value.startsWith("TODO") ? undefined : value);

  return (
    <>
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "CreativeWork",
              "@id": `${url}#work`,
              mainEntityOfPage: url,
              url,
              name: meta.title,
              alternateName: caseStudyLabel(slug),
              headline: meta.seoTitle ?? meta.title,
              description: meta.summary,
              ...(meta.tags?.length && {
                keywords: meta.tags.join(", "),
                about: meta.tags.map((name) => ({ "@type": "Thing", name })),
              }),
              ...(known(meta.role) && { creditText: `${person.name}, ${meta.role}` }),
              // The hero first, then every image on the page with its alt
              // text, so image search and answer engines know what each shows.
              image: [
                ...(image ? [imageObject({ src: image, alt: meta.hero?.alt ?? meta.title })] : []),
                ...images.filter((i) => i.src !== image).map(imageObject),
              ],
              ...(videos.length && { video: videos.map(videoObject) }),
              ...(known(meta.client) && {
                sourceOrganization: meta.client.split(", ").map((name) => ({ "@type": "Organization", name })),
              }),
              ...(known(meta.year) && { temporalCoverage: meta.year.replace("–", "/") }),
              inLanguage: "en-US",
              creator: { "@id": person["@id"] },
              isPartOf: { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: meta.title, item: url },
              ],
            },
          ],
        }}
      />
      <WipeOnLeave>
        <CaseStudy slug={slug} />
      </WipeOnLeave>
    </>
  );
}
