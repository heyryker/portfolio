import { PixelGarden } from "./PixelGarden";
import { EMAIL, PROFILES } from "@/lib/site";

/**
 * The landing page's footer, under the case-study cards: the same strip of
 * pixel grass and flowers as the case study headers, then email and LinkedIn.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="relative h-[calc(var(--grid-cell)*2)]">
        <PixelGarden />
      </div>
      <ul className="site-footer-links">
        <li>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </li>
        <li>
          <a href={PROFILES.linkedin} target="_blank" rel="noopener">
            LinkedIn
          </a>
        </li>
      </ul>
    </footer>
  );
}
