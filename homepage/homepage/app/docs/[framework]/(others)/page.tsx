import MdxSource from "@/components/docs/docs-intro.mdx";
import { frameworks } from "@/lib/framework";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";

export default function Page() {
  return (
    <>
      <div className="not-prose">
        <h1 className="sr-only">Getting started</h1>
        <HeroHeader
          title={
            <>
              Learn some{" "}
              <JazzLogo className="h-[1.3em] relative -top-0.5 inline-block -ml-[0.1em] -mr-[0.1em]" />
            </>
          }
          slogan=""
          pt={false}
        />
      </div>
      <MdxSource />
    </>
  );
}

export function generateStaticParams() {
  return frameworks.map((framework) => ({ framework }));
}
