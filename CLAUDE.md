# heyryker.com: Portfolio Build Brief

This file is the source of truth for building Ryker Marble's portfolio site. Read it fully before writing code. When something here conflicts with a general best practice, follow this file and leave a comment explaining the tradeoff. Where content is missing, build the structure with clearly marked placeholders (`TODO(ryker): …`). Never invent metrics, clients or quotes.

The landing page mockup is in `/design/landing-mockup.png`. Match it closely.

---

## 1. Goal and audience

- **Primary audience:** hiring managers and recruiters.
- **Positioning:** Ryker is a **Brand / Creative Lead**: a senior brand designer who sets the look and story of a brand, with strengths in strategy, production and art direction.
- **Target fields:** B2B SaaS, cybersecurity, Web3 and fintech, plus broader brand-storytelling roles.
- **What success looks like:** a hiring manager opens a case study, is impressed, and contacts Ryker or downloads the resume. Every page should make those two actions easy to find.

## 2. Tech stack

- **Next.js** (App Router) with **TypeScript** and **Tailwind CSS**, deployed on **Vercel**. GitHub repo: `github.com/heyryker`.
- **Framer Motion** for page transitions and the meeple explosion and regeneration.
- **Meeple physics:** a lightweight custom loop (requestAnimationFrame) is preferred. Use `matter-js` only if a custom loop gets messy. Keep the landing page fast.
- **Blog:** MDX files in `/content/blog`, with frontmatter for title, date, summary and cover image.
- **Case studies:** MDX files in `/content/work`, so Ryker can edit the copy without touching components.
- **Light mode only.** No dark mode.
- Static generation everywhere. No database and no CMS.

## 3. Visual system

### Colors (sampled from the mockup)

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FFFFFF` | Page background |
| `grid` | `#DDDEDE` | Background grid lines |
| `ink` | `#000000` | Headlines, body text |
| `ink-soft` | `#221F20` | Hamburger icon, UI chrome |
| `muted` | `#A1A3A6` | Bracket nav labels, captions |
| `accent` | `#58B9F8` | The one accent color: "[I'M]", the pixel squares, links, focus rings |
| `meeple-yellow` | `#FBEC5A` | Yellow meeple |
| `meeple-green` | `#5FCC8A` | Green meeple |
| `meeple-purple` | `#985DF6` | Purple meeple |
| `meeple-red` | `#E05A32` | Orange-red meeple |
| `meeple-blue` | `#58B9F8` | Blue meeple (same as the accent) |

Use meeple colors only for meeples and small playful moments, never for body text. Blue is the only UI accent.

### Typography

- **Inter**: heavy weights (800–900) for headlines like "HEY / RYKER", and regular or medium for body text.
- **A pixel accent font** (e.g. Silkscreen or Pixelify Sans from Google Fonts) used sparingly for small details: tags, metadata, the 404 page, the footer and meeple speech moments. The **[BRACKET]** nav labels stay in Inter uppercase, as in the mockup. Only reach for the pixel font where it ties the type to the meeples.
- Uppercase with generous letter-spacing for labels. Sentence case for body text.

### Signature details

- **Square brackets** frame labels and asides: `[HACKATHON]`, `[I'M]`, `[RESUME]`. Use them consistently across nav, tags and section labels.
- **Small blue pixel squares** act as punctuation: the period after RYKER, a mark before "HEY", and one in the top-left corner as the logo/home mark. Reuse them as bullets and section markers.
- **Background grid:** a subtle square grid of 1px `grid` lines over the white, covering the whole viewport, like graph paper. Cells are about 44px in the mockup. Ideally the cell size is a clean multiple of the meeple pixel size, so the meeples feel like they live on the grid. Keep it subtle enough that it never competes with the text. Use it on the landing page. On case studies and the blog, use it lightly (e.g. only in headers) or not at all, if it fights with the work.
- Lots of white space. The page should feel calm until someone plays with it.

## 4. Landing page (`/`)

Match `/design/landing-mockup.png`:

- The subtle background grid (see §3).

- Large, staggered headline taking up most of the width: **HEY** on the first line, with **[I'M]** in blue and smaller next to it, then **RYKER** on the second line, offset to the right. A blue pixel square sits at the top-left corner of HEY, and another forms RYKER's period. Both squares are scaled up to match the big type.
- **The blue headline elements change color when a meeple walks over them.** That means "[I'M]" and the two pixel squares. When a meeple overlaps one of them, that element smoothly takes on the meeple's color (yellow, green, purple or orange-red; blue stays blue). After the meeple leaves, it fades back to `accent` within about a second. Use simple bounding-box overlap. A thrown meeple flying across should leave a quick color flicker. Respect reduced motion: no color changes, since the meeples don't move.
- **Top left:** a blue pixel square that serves as the home link.
- **Top right:** a hamburger menu (see §6).
- **Bottom row:** five case-study links in muted gray brackets, in this order:
  `[HACKATHON]  [TRON]  [MOTION]  [EMAIL]  [EDITORIAL]`
  On hover, a label turns `ink` or `accent`, and a meeple may glance at it.
- **Five meeples** move around the full viewport (see §5).

### Case study transition

Clicking a case study label makes the case study **slide up from the bottom** and cover the landing screen. Closing it, or pressing the browser back button, slides it back down to the meeples.

- Each case study still has a real URL (`/work/hackathon`, `/work/tron`, `/work/motion`, `/work/email`, `/work/editorial`). The slide-up is a transition between routes, so links can be shared and opened directly. Opening a URL directly loads the case study without the animation.
- Keep a visible close or back control (e.g. `[← BACK]` or an ✕ made of pixels).

## 5. The meeples

The meeples are the signature interaction, so take care with them.

### Shape

Each meeple is a small pixel figure built on a 3-wide grid, matching the mockup:

```
 . H .      H = head, with two small eye pixels
 X X X      arms / shoulders
 . X .      body
 X . X      legs
```

Render them as crisp pixels: SVG `rect`s or DOM blocks with `image-rendering: pixelated`. Never blur or anti-alias them. They're roughly 40px tall on desktop, as in the mockup.

### Shared behavior (all five)

1. **Wander:** they move on their own with an idle walk or hop, and occasionally pause.
2. **React to the cursor:** each in its own way, according to its personality (below).
3. **Drag and throw:** grab one with the mouse or a finger and fling it. It bounces off the viewport edges and the other meeples, with simple physics (velocity, friction, light gravity or none; whatever feels best).
4. **Click or tap to explode:** the meeple **shakes** for a moment, then **bursts into its individual pixel blocks**, which scatter with physics. After a few seconds the blocks **slowly drift back and reassemble** into the meeple, which picks up where it left off.

Meeples may walk over the headline, which triggers the color change, but they must never block clicks on the case study labels or the menu. Let clicks pass through to the labels where the two overlap, or keep meeples beneath them in the stacking order.

### Personalities

| Meeple | Name | Cursor behavior |
|---|---|---|
| Yellow | **The Curious One** | Drifts toward the cursor and follows it at a polite distance. |
| Green | **The Shy One** | Scoots away when the cursor gets close, then peeks back. |
| Purple | **The Watcher** | Stays perched near the headline and follows the cursor with its eyes. Moves little. |
| Orange-red | **The Chaotic One** | Faster than the others. Bumps into other meeples and rushes the cursor before swerving off. |
| Blue | **The Sleepy One** | Barely moves, ignores the cursor and naps (a tiny "z" in the pixel font is a nice touch). It only wakes if clicked or hit by a thrown meeple. Blue is the accent color, so it's the "Ryker" meeple. |

### Mobile and touch

- **Touch replaces the cursor:** the last touch point is the "cursor" for personality reactions. Tap to explode and drag to throw.
- Make sure dragging a meeple doesn't scroll the page, but swiping empty space and tapping labels still work normally.

### Accessibility and performance

- Respect `prefers-reduced-motion`: meeples stand still in their mockup positions, there's no wandering or explosion, and the slide-up becomes a simple fade.
- Meeples are decorative (`aria-hidden`). Everything important is reachable by keyboard: the labels, the menu and the close button.
- Pause the animation loop when the tab is hidden. Aim for smooth 60fps on a mid-range phone.

## 6. Menu and other pages

The hamburger opens a full-screen or side-panel menu with:

- **[RESUME]**: `/resume` opens the resume PDF (`/public/resume/ryker-marble-resume.pdf`, `TODO(ryker): add PDF`), with a visible download button.
- **[BLOG]**: `/blog`
- **[ABOUT]**: `/about`
- **[CONTACT]**: `/contact`, or a contact panel inside the menu.

The menu can have a meeple or two peeking in from the edge.

### About (`/about`)

- Current headline to start from: *"I'm a brand designer interested in strategy, production and art direction."*
- Short bio in the witty voice, a photo (`TODO(ryker): photo`) and a short experience list:
  - Senior Brand Designer, Lucid Software (2022–present) `TODO(ryker): confirm dates`
  - Contract Designer, TRON DAO (2025–2026)
  - Freelance Graphic Designer (2017–present)
  - Brand Designer, Impact Suite (2021–2022)
- Based in Utah.

### Contact

Links only, with no form:

- **Email:** rykermarble@gmail.com, as a `mailto:` link plus a click-to-copy button. The confirmation is a small witty line such as "Copied. Your move."
- **Phone:** (435) 257-6458, as a `tel:` link
- **LinkedIn:** https://www.linkedin.com/in/ryker-marble/
- **GitHub:** https://github.com/heyryker

## 7. Case studies

### Layout: visual-first

Every case study uses the same visual-first template:

1. **Hero:** a large full-bleed image or autoplaying muted video loop.
2. **Title and one-line summary**, with a small metadata row in the pixel or bracket style: `[ROLE] … [CLIENT] … [YEAR]`.
3. **Mostly full-bleed visuals** with short captions. Text stays brief, and the work does the talking.
4. **Optional results band.** Show big numbers only where real metrics exist. Never invent them.
5. **End of page: next project plus contact.**
   - A big "Next: [TRON]" link that slides the next case study up. The last one loops back to the first.
   - Below it, a short witty contact line with an email link, e.g. "Like what you see? I'm one email away." `TODO(ryker): approve line`

Use `next/image` and lazy-loaded video with a poster image. Support a mix of images, videos and embeds in MDX.

### The five case studies

Placeholder content comes from the current heyryker.com, which is being shut down. Write the copy below straight into the MDX files and don't link to the old site anywhere. Mark all missing assets with `TODO(ryker)`.

**1. [HACKATHON]: Lucid Hackathon 2025, "designing the impossible"** (`/work/hackathon`)
- Role: Lead Brand Designer. Client: Lucid Software.
- The event identity had to say "complex problems get solved by changing perspective."
- Story: references (M.C. Escher's impossible architecture, *Monument Valley*) collected on a Lucidspark board, then an isometric grid with a modular library of 3D-like forms built from one isometric square, then two directions (a surreal impossible shape vs. the title as a typographic sculpture), then the typographic route, refined with arches and staircases.
- Deliverables: logo mark, slide templates, signage, badges, swag and a digital marketing toolkit.
- Closing line: "Impossible in all the right ways."

**2. [TRON]: TRON DAO brand system and design challenge** (`/work/tron`)
- Role: Brand Designer (contract). Client: TRON DAO.
- **Part 1, the brand system:** a micro-rebrand from the CN team had left the system fragmented and dependent on one designer. Ryker audited every asset across the US and CN teams in FigJam and presented the findings to leadership. The result was a **nine-category guidelines framework** delivered as a living **Figma Sites** guidelines site, plus componentized Figma libraries.
  - Categories to show visually: Foundation & Strategy, Personality & Voice ("Be Visionary, Not Vague / Bold, Not Arrogant / Kinetic, Not Static"), Logo & Clearspace, Color (TRON Red #DC062B, Charcoal #100000), Typography & Grids, Imagery, Data Visualization, Brand Scale (Functional ↔ Expressive), and the System Cheat Sheet.
  - Outcome: from a one-designer bottleneck to a scalable system the US and global teams can use on their own. `TODO(ryker): any adoption numbers?`
- **Part 2, the TRON DAO design challenge:** process in review. `TODO(ryker): paste in the copy and images from the old blog post`
- Credit the lead US brand designer who worked on the audit. `TODO(ryker): name`
- The TRON partner videos are **not** in this case study. They live in [MOTION].

**3. [MOTION]: art direction for video** (`/work/motion`)
- **Lucid product walkthrough videos:** art direction. `TODO(ryker): videos, scope, which products`
- **TRON DAO partner ad videos** (MetaMask, zerohash): Ryker was Art Director. He built visual systems that bridged TRON's look with each partner brand, created storyboards and directed the motion team (with Rafael Conce at Sons Design), and did final brand-consistency checks.
- The hero should be a video loop. Lead with motion, not text.

**4. [EMAIL]: email campaigns at Lucid** (`/work/email`)
- Role: `TODO(ryker)`. Client: Lucid Software.
- This is the results-heavy case study, so it gets a results band.
  - Reactivation campaign: **+26%** and **+15.6%** `TODO(ryker): what each number measures`
  - Email A/B tests `TODO(ryker): what was tested, what won`
  - `TODO(ryker): confirm whether the "Lately at Lucid" launch (+62%, 11,000 registrations) belongs here`
- Visuals: email designs shown in device or inbox frames, plus before/after variants for the A/B tests.

**5. [EDITORIAL]: State of Compliance report** (`/work/editorial`)
- Role: Freelance Graphic Designer. Client: Sixfifty.
- A gated editorial report presenting third-party research data, meant to position Sixfifty as a thought leader and generate qualified leads.
- Highlights: a four-column baseline grid, custom data visualizations, and paced storytelling built around the insights.
- `TODO(ryker): spreads, any lead/download numbers`

## 8. Blog (`/blog`)

- An MDX list page in the site's style: title, date and a one-line summary per post, with bracket tags.
- **Carry over from the current site:**
  - "If I Wasn't a Designer, I'd Run a Food Truck" (9/2/25) `TODO(ryker): paste in the copy`
- **New posts** (draft from current-site content, marked `TODO(ryker)` for him to finish):
  - **CKO, "Strong Past, Strong Future":** Lucid's Company Kick-Off identity. Bubble-letter "CKO" logo, art direction on the exec hype video, booth and signage, apparel and swag, and an event toolkit.
  - **U of U Theatre building:** a 60-foot graphic timeline and two feature walls for the University of Utah Theatre Department, done freelance for GSBS Architects.
- No redirects. The old site is being shut down, and this is a fresh start.

## 9. Voice and tone

**Witty and playful, with the wit in the details.**

- **Case studies and the About intro stay clear and professional.** Short, confident sentences that state the problem, what was done and what changed. No jokes that get in the way of the work.
- **Personality shows in the edges:** microcopy, hover states, the 404 page, the footer, the email-copy confirmation, empty states, meeple moments and the About page's closing lines.
- First person ("I"). Plain words, no buzzwords, no exclamation marks.

Starting points for microcopy, all to be approved by Ryker:

- **404:** "This page exploded. It'll regenerate. Probably." Show a meeple slowly reassembling, with a `[TAKE ME HOME]` link.
- **Footer:** "Designed by Ryker. Animated by five very small coworkers."
- **Copy-email confirmation:** "Copied. Your move."
- **End-of-case-study contact line:** "Like what you see? I'm one email away."

## 10. SEO, metadata and launch

- Title: "Ryker Marble: Brand & Creative Lead". Write a meta description for each page.
- Open Graph image: the HEY [I'M] RYKER headline with the meeples, generated with `next/og`.
- Use semantic HTML, alt text on every image (`TODO(ryker)` where unknown), and visible focus states in the accent blue.
- Add Vercel Analytics if it's free on Ryker's plan.
- Domain: heyryker.com moves to Vercel when the old site is shut down. Ryker handles the DNS change, so don't change DNS as part of the build.

## 11. Build order

1. Scaffold the Next.js + Tailwind project with the color and type tokens.
2. Landing page layout matching the mockup, with static meeples.
3. Meeple engine: wander, then personalities, then drag/throw, then explode/regenerate, then touch, then reduced motion.
4. Case study template, the slide-up route transition and the five MDX placeholders.
5. Menu, About, Contact and the resume page.
6. Blog with carried-over and draft posts.
7. 404, footer, metadata and OG image.
8. Check on mobile, with keyboard navigation and with reduced motion.

Open a pull request after each step (or small group of steps) so Ryker can review the Vercel preview before merging.
