import { CaseStudyNav } from "@/components/CaseStudyNav";
import { Headline } from "@/components/Headline";
import { MeepleField } from "@/components/MeepleField";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div
      data-meeple-root=""
      className="bg-graph relative h-svh min-h-[480px] overflow-hidden select-none"
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
      <MeepleField />
      <CaseStudyNav />
    </div>
  );
}
