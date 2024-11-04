import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import CursorsAndCaretsDescription from "@/app/(home)/toolkit/cursorsAndCarets.mdx";
import TwoWaySyncDescription from "@/app/(home)/toolkit/twoWaySync.mdx";
import VideoPresenceCallsDescription from "@/app/(home)/toolkit/videoPresenceCalls.mdx";
import { CodeRef } from "gcmp-design-system/src/app/components/atoms/CodeRef";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import CoPlainTextDescription from "@/app/(home)/coValueDescriptions/coPlainTextDescription.mdx";

export function ComingSoonSection() {
    return (
        <div>
            <SectionHeader title="More features coming soon" />

            <GappedGrid>
                <GridCard>
                    <H3>Cursors & carets</H3>
                    <P className="text-lg">Ready-made spatial presence.</P>
                    <Prose size="sm">
                        <CursorsAndCaretsDescription />
                    </Prose>
                </GridCard>

                <GridCard>
                    <H3>Two-way sync to your DB</H3>
                    <P className="text-lg">Add Jazz to an existing app.</P>
                    <Prose size="sm">
                        <TwoWaySyncDescription />
                    </Prose>
                </GridCard>

                <GridCard>
                    <H3>Video presence & calls</H3>
                    <P className="text-lg">Stream and record audio & video.</P>
                    <Prose size="sm">
                        <VideoPresenceCallsDescription />
                    </Prose>
                </GridCard>

                <GridCard>
                    <H3>
                        <CodeRef>CoPlainText</CodeRef> &{" "}
                        <CodeRef>CoRichText</CodeRef> <ComingSoonBadge />
                    </H3>
                    <Prose size="sm">
                        <CoPlainTextDescription />
                    </Prose>
                </GridCard>
            </GappedGrid>
        </div>
    );
}
