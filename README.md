# heyryker.com

Ryker Marble's portfolio. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Vercel.
The build brief lives in [`CLAUDE.md`](./CLAUDE.md); the landing mockup is in [`design/landing-mockup.png`](./design/landing-mockup.png).

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## SEO and answer engines

- `lib/site.ts`: site facts (URL, bio, experience, contact) and `pageMetadata()`, shared by page metadata, JSON-LD, the sitemap and `/llms.txt`.
- Every page sets a canonical URL, Open Graph and Twitter fields with `pageMetadata()` from `lib/site.ts`.
- Structured data (schema.org JSON-LD via `components/JsonLd.tsx`): Person and WebSite on the home page, ProfilePage on About, Blog on the index, BlogPosting and BreadcrumbList on each post.
- `app/sitemap.ts`, `app/robots.ts` (AI crawlers are allowed on purpose) and `app/llms.txt/route.ts`.
- `app/opengraph-image.tsx` draws the share card with the fonts in `assets/fonts` (Inter and Silkscreen, both OFL). `app/icon.svg` is the favicon.

## Where things live

- `app/globals.css`: color and type tokens (`bg-accent`, `text-muted`, `font-pixel`, …), the graph-paper background and focus rings.
- `app/page.tsx`: the landing page.
- `components/`: headline, header, case-study nav and the meeple SVG.
- `app/village/page.tsx`, `components/VillageField.tsx` and `lib/village-engine.ts`: the meeples' town at `/village` (random layout per visit, gardening, visits, town meetings and court).
- `lib/meeples.ts`: the five meeples (names, colors, personalities, mockup positions) and the pixel shape.
- `lib/work.ts`: the case-study list and order.
- `content/work/*.mdx`: case-study copy. Each file exports `meta` (title, summary, role, client, year, hero) and can use `<Figure>`, `<Video>`, `<Pair>`, `<Results>` and `<Todo>` (see `components/work/blocks.tsx`). Leave out `src` to show a placeholder.
- `app/work/[slug]`: a case study on its own URL. `app/@work/(.)work/[slug]`: the same case study wiping up over the current page when opened from inside the site.
