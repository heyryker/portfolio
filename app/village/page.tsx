import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { SiteHeader } from "@/components/SiteHeader";
import { VillageField } from "@/components/VillageField";

export const metadata: Metadata = pageMetadata({
  title: "Village",
  description:
    "Where the five meeples from Ryker Marble's homepage live: a little pixel town with houses, a community garden, a Town Hall and a courthouse.",
  path: "/village",
});

/**
 * The meeples' town (lib/village-engine.ts). The canvas is decorative; the
 * heading and description tell everyone else what's going on.
 */
export default function VillagePage() {
  return (
    <div data-village-root="" className="relative min-h-svh overflow-hidden bg-[#eaf6ee] select-none">
      <SiteHeader />
      <VillageField />
      <div className="pointer-events-none absolute bottom-[18px] left-[22px] z-10 flex items-baseline gap-3 md:bottom-[22px] md:left-[44px]">
        <h1 className="text-sm tracking-[0.08em] text-muted uppercase">[Village]</h1>
        <p aria-hidden="true" className="font-pixel text-[10px] text-muted">
          POP. 5
        </p>
      </div>
      <p className="sr-only">
        A pixel town where the five meeples live. Each has a house in its own color around a community garden, with
        the Town Hall at the top and the courthouse at the bottom. They plant, water and harvest the garden, carry the
        harvest to each other&apos;s doors, visit, nap, and gather when the bell rings for a town meeting.
      </p>
    </div>
  );
}
