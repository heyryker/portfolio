import { PixelGarden } from "./PixelGarden";
import { EMAIL, GA_MEASUREMENT_ID, PROFILES } from "@/lib/site";

/**
 * The landing page's footer, under the case-study cards: the same strip of
 * pixel grass and flowers as the case study headers, then email and LinkedIn,
 * and a one-line note that the site uses Google Analytics (Google's terms ask
 * sites to say so).
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
      {GA_MEASUREMENT_ID && (
        <p className="site-footer-note">Visits counted by Google Analytics. Meeples counted by hand.</p>
      )}
    </footer>
  );
}
