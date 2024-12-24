import { TilescapeLogo } from "@/components/TilescapeLogo";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { H2, H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { GardenLogo } from "gcmp-design-system/src/app/components/atoms/logos/GardenLogo";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";

function ComingSoon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full bg-stone-200 py-1 px-3 text-stone-800 text-sm dark:text-stone-300 dark:bg-stone-800">
      {children}
    </div>
  );
}

export default function Products() {
  return (
    <div className="grid gap-5">
      <H2>Theses & Products</H2>
      <GappedGrid>
        <GridCard>
          <H3>Distributed state is too hard.</H3>
          <P>
            Having state all over the place is the hardest part of every app.
            What if it didn&apos;t have to be?
          </P>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <JazzLogo className="h-10 w-auto" />
              <div>
                <Button href="https://jazz.tools" variant="secondary">
                  Go to jazz.tools
                </Button>
              </div>
            </div>
            <P>
              Jazz is an open-source toolkit for sync & secure collaborative
              data.
            </P>
          </div>
        </GridCard>

        <GridCard>
          <H3>Software is places, not apps.</H3>
          <P>
            People inhabit software. This means we can architect virtual places
            to be fit for humans.
          </P>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <GardenLogo className="h-11 w-auto" />
              <div>
                <ComingSoon>Coming 2025</ComingSoon>
              </div>
            </div>
            <P>
              Garden is a home to think in. A note-taking space for your
              thoughts, projects and dreams.
            </P>
          </div>
        </GridCard>

        {/* <GridCard>
            <H3>AI is an essence, not a feature.</H3>
            <P>
              People inhabit software. This means we can architect virtual places
              to be fit for humans.
            </P>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <GardenLogo className="h-10 w-auto" />
                <div>
                  <ComingSoon>Coming 2025</ComingSoon>
                </div>
              </div>
              <P>
                Garden is a home to think in. A note-taking space for your
                thoughts, projects and dreams.
              </P>
            </div>
          </GridCard> */}

        <GridCard>
          <H3>Humanity needs simulation.</H3>
          <P>
            Complex systems rule our world. Simulation makes time, space and
            possibilities visceral.
          </P>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <TilescapeLogo className="h-10 w-auto" />
              <div>
                <ComingSoon>Coming 2025</ComingSoon>
              </div>
            </div>
            <P>
              Tilescape is an open-source toolkit for running and rendering
              infinitely scalable simulations.
            </P>
          </div>
        </GridCard>
      </GappedGrid>
    </div>
  );
}
