import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/site";

/*
 * Countries where analytics cookies need opt-in consent (EU, EEA, UK,
 * Switzerland). GA reads the visitor's location itself and applies the
 * "denied" default only there, so everyone else gets normal GA with no
 * banner. Until an EU visitor opts in (components/CookieNotice.tsx), GA sends
 * cookieless pings only.
 */
const CONSENT_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES",
  "SE", "IS", "LI", "NO", "GB", "CH",
];

/**
 * GA4 alongside Vercel Analytics, for what Vercel's Hobby plan doesn't show:
 * cities, engagement time and the site's custom events (lib/analytics.ts).
 * Page views on client-side navigation (including the case study wipe) come
 * from GA's enhanced measurement, which watches URL changes.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  // The consent default has to be queued before `config`, so both go in one
  // inline script. gtag.js itself loads once the page is idle, to keep it off
  // the critical path (the landing page scores 99 on phones).
  const init = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  region: ${JSON.stringify(CONSENT_REGIONS)}
});
gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
try { if (localStorage.getItem('ga-consent') === 'granted') gtag('consent', 'update', { analytics_storage: 'granted' }); } catch (e) {}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)});
`;

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
        {init}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}
