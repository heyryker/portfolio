"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { TagPills } from "@/components/TagPills";

export type BlogCard = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  /** Already formatted for display, e.g. SEP 2, 2025. */
  dateLabel: string;
  cover: string;
  coverAlt: string;
  tags: string[];
};

/**
 * The blog index: a search box and a row of tag filters over a grid of post
 * cards (two columns on tablets, three on wide screens). Every post is in the
 * server-rendered HTML; filtering only hides cards, so crawlers and visitors
 * without JavaScript see the whole list. The chosen tag lives in the URL
 * (?tag=…), so the tag pills on a post can link straight to a filtered view.
 */
export function BlogBrowser({
  posts,
  tags,
  allTags,
}: {
  posts: BlogCard[];
  /** The tags shown as filter buttons. */
  tags: string[];
  /** Every tag, so ?tag= works for one-off tags too. */
  allTags: string[];
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  // Read ?tag= once on load. (Not useSearchParams, which would make the whole
  // page render on the client.)
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("tag");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from the URL once on mount
    if (fromUrl && allTags.includes(fromUrl)) setTag(fromUrl);
  }, [allTags]);

  const choose = (next: string | null) => {
    setTag(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("tag", next);
    else url.searchParams.delete("tag");
    window.history.replaceState(window.history.state, "", url);
  };

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return new Set(
      posts
        .filter((p) => !tag || p.tags.includes(tag))
        .filter((p) => {
          const text = `${p.title} ${p.summary} ${p.tags.join(" ")}`.toLowerCase();
          return words.every((w) => text.includes(w));
        })
        .map((p) => p.slug),
    );
  }, [posts, query, tag]);

  return (
    <>
      <div className="blog-filters">
        <label className="blog-search">
          <Icon name="search" className="size-5 text-[#767676]" />
          <span className="sr-only">Search posts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
        <div role="group" aria-label="Filter by tag" className="blog-tags">
          <button type="button" aria-pressed={!tag} onClick={() => choose(null)} className="blog-tag">
            All
          </button>
          {(tag && !tags.includes(tag) ? [...tags, tag] : tags).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => choose(tag === t ? null : t)}
              className="blog-tag"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="blog-count">
        {shown.size === posts.length ? `${posts.length} posts` : `${shown.size} of ${posts.length} posts`}
      </p>

      <ul className="blog-grid">
        {posts.map((post, i) => (
          <li key={post.slug} hidden={!shown.has(post.slug)}>
            <Link href={`/blog/${post.slug}`} className="blog-card">
              <span className="blog-card-thumb">
                <Image
                  src={post.cover}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  priority={i < 3}
                  className="object-cover"
                />
              </span>
              <span className="blog-card-text">
                <time dateTime={post.date} className="blog-card-date">
                  {post.dateLabel}
                </time>
                <span className="blog-card-title">{post.title}</span>
                <span className="blog-card-summary">{post.summary}</span>
              </span>
              <TagPills tags={post.tags} />
            </Link>
          </li>
        ))}
      </ul>

      {shown.size === 0 && (
        <p className="blog-empty">
          Nothing matches that. The meeples checked twice.{" "}
          <button type="button" onClick={() => (setQuery(""), choose(null))}>
            Show all posts
          </button>
        </p>
      )}
    </>
  );
}
