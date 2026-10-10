import { CaseStudyNav } from "@/components/CaseStudyNav";
import { Headline } from "@/components/Headline";
import { SiteHeader } from "@/components/SiteHeader";
import { StaticMeeples } from "@/components/StaticMeeples";

export default function Home() {
  return (
    <div
      className="bg-graph relative h-svh min-h-[480px] overflow-hidden"
      style={
        {
          // HEY is ~12.5% of the viewport width in the mockup. Wider on phones so
          // it still fills the screen, and capped by height on short windows.
          "--headline-size": "min(12.45vw, 23vh)",
        } as React.CSSProperties
      }
    >
      <SiteHeader />
      <main className="absolute inset-0 grid place-items-center max-md:[--headline-size:16vw]">
        <Headline />
      </main>
      <StaticMeeples />
      <CaseStudyNav />
    </div>
  );
}
