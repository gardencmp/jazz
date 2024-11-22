import CoPlainTextDescription from "@/app/(home)/coValueDescriptions/coPlainTextDescription.mdx";
import CursorsAndCaretsDescription from "@/app/(home)/toolkit/cursorsAndCarets.mdx";
import TwoWaySyncDescription from "@/app/(home)/toolkit/twoWaySync.mdx";
import VideoPresenceCallsDescription from "@/app/(home)/toolkit/videoPresenceCalls.mdx";
import { Card } from "gcmp-design-system/src/app/components/atoms/Card";
import { CodeRef } from "gcmp-design-system/src/app/components/atoms/CodeRef";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";

export function ComingSoonSection() {
  return (
    <div>
      <SectionHeader title="More features coming soon" />

      <GappedGrid cols={4}>
        <Card className="p-4">
          <h3 className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
            Cursors & carets
          </h3>
          <P>Ready-made spatial presence.</P>
          <Prose size="sm">
            <CursorsAndCaretsDescription />
          </Prose>
        </Card>

        <Card className="p-4">
          <h3 className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
            Two-way sync to your DB
          </h3>
          <P>Add Jazz to an existing app.</P>
          <Prose size="sm">
            <TwoWaySyncDescription />
          </Prose>
        </Card>

        <Card className="p-4">
          <h3 className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
            Video presence & calls
          </h3>
          <P>Stream and record audio & video.</P>
          <Prose size="sm">
            <VideoPresenceCallsDescription />
          </Prose>
        </Card>

        <Card className="p-4">
          <h3 className="text-stone-900 font-medium md:text-base dark:text-stone-100 mb-2">
            <CodeRef>CoPlainText</CodeRef> & <CodeRef>CoRichText</CodeRef>
          </h3>
          <Prose size="sm">
            <CoPlainTextDescription />
          </Prose>
        </Card>
      </GappedGrid>
    </div>
  );
}
