import Link from "next/link";

/**
 * A project's topics as small light gray pills. On blog posts each pill
 * links to the blog filtered by that tag, which also gives search engines
 * a path from post to post.
 */
export function TagPills({ tags, link = false }: { tags: readonly string[]; link?: boolean }) {
  return (
    <ul className="tag-pills">
      {tags.map((tag) => (
        <li key={tag}>
          {link ? (
            <Link href={`/blog?tag=${encodeURIComponent(tag)}`} className="tag-pill">
              {tag}
            </Link>
          ) : (
            <span className="tag-pill">{tag}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
