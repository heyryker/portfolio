import { CaseStudyNav } from "@/components/CaseStudyNav";
import { Headline } from "@/components/Headline";
import { SiteHeader } from "@/components/SiteHeader";
import { StaticMeeples } from "@/components/StaticMeeples";

export default function Home() {
  return (
    <div className="bg-graph relative h-svh min-h-[480px] overflow-hidden">
      <SiteHeader />
      <main className="absolute inset-0">
        <Headline />
      </main>
      <StaticMeeples />
      <CaseStudyNav />
    </div>
  );
}
