import { CaseStudyNav } from "@/components/CaseStudyNav";
import { Headline } from "@/components/Headline";
import { MeepleField } from "@/components/MeepleField";
import { SiteHeader } from "@/components/SiteHeader";
import { LandingMarker } from "@/components/work/LandingMarker";

export default function Home() {
  return (
    <div data-meeple-root="" className="bg-graph relative h-svh min-h-[480px] overflow-hidden select-none">
      <SiteHeader />
      <main className="absolute inset-0">
        <Headline />
      </main>
      <MeepleField />
      <CaseStudyNav />
      <LandingMarker />
    </div>
  );
}
