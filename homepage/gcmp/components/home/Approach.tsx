import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { H2, H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";

export default function Approach() {
  return (
    <div className="grid gap-5">
      <H2>Approach</H2>
      <GappedGrid>
        <GridCard>
          <H3>Find tall abstractions</H3>

          <P>
            In a world drowning in complexity, we need to invent tools that let
            us do more with less.
          </P>
        </GridCard>
        <GridCard>
          <H3>Grow open ecosystems</H3>

          <P>
            Open-source and simple standards enable permissionless adoption of
            new tech at scale.
          </P>
        </GridCard>
        <GridCard>
          <H3>Provide reliable infrastructure</H3>

          <P>
            There is immense value in generic, reusable and reliable
            infrastructure provided at low cost.
          </P>
        </GridCard>
        <GridCard>
          <H3>Design good user environments</H3>

          <P>
            The best tech is made by vertically integrated companies that design
            for their own users.
          </P>
        </GridCard>
      </GappedGrid>
    </div>
  );
}
