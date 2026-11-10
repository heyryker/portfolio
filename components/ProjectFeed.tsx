import Image from "next/image";
import Link from "next/link";

export type FeedItem = {
  href: string;
  image: string;
  alt: string;
  /** First caption line: the client or the post title. */
  name: string;
  /** Second caption line: the kind of work, or the post's year. */
  detail: string;
};

/**
 * Every case study and blog post as one long scroll of big images, each one
 * a link to the project (case studies slide up over the landing page through
 * the intercepted route). The rhythm repeats one full-width image, then two
 * side by side, so the scroll doesn't turn into a uniform grid. Phones get a
 * single column. Captions sit under the image: name, then what it was.
 * Styles live in globals.css under `.feed`.
 */
export function ProjectFeed({ items }: { items: FeedItem[] }) {
  return (
    <section aria-label="Work and writing" className="feed">
      <ul className="feed-list">
        {items.map((item, i) => {
          const wide = i % 3 === 0;
          return (
            <li key={item.href} className="feed-item" data-wide={wide ? "" : undefined}>
              <Link href={item.href} className="feed-link group">
                <span className="feed-media">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    fill
                    // The first image is near the fold on most screens.
                    priority={i === 0}
                    sizes={wide ? "(min-width: 768px) calc(100vw - 106px), 100vw" : "(min-width: 768px) 50vw, 100vw"}
                    className="feed-image"
                  />
                </span>
                <span className="feed-caption">
                  <span className="feed-name">{item.name}</span>
                  <span className="feed-detail">{item.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
