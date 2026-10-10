# heyryker.com

Ryker Marble's portfolio. Next.js (App Router) + TypeScript + Tailwind CSS v4, deployed on Vercel.
The build brief lives in [`CLAUDE.md`](./CLAUDE.md); the landing mockup is in [`design/landing-mockup.png`](./design/landing-mockup.png).

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Where things live

- `app/globals.css`: color and type tokens (`bg-accent`, `text-muted`, `font-pixel`, …), the graph-paper background and focus rings.
- `app/page.tsx`: the landing page.
- `components/`: headline, header, case-study nav and the meeple SVG.
- `lib/meeples.ts`: the five meeples (names, colors, personalities, mockup positions) and the pixel shape.
- `lib/work.ts`: the case-study list and order.
