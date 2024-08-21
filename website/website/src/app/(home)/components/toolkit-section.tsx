import { Card, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { ParsedContent } from "@/lib/mdx-types";
import { PackagesSection } from "@/components/layout";
import { Badge } from "@/components/mdx";

type Props = {
  contentItems: ParsedContent[];
};

export const ToolkitSection = ({ contentItems }: Props) => (
  <>
    <PackagesSection
      theme="toolkit"
      heading="The Jazz Toolkit"
      subheading="A high-level toolkit for building apps around CoValues."
      link="/docs"
      description={
        <>
          <p className="">Supported environments:</p>
          <ul className="list-disc list-inside pl-[2px]">
            <li>Browser (sync via WebSockets, IndexedDB persistence)</li>
            <li>React Vanilla JS / framework agnostic base</li>
            <li>
              React Native <Badge>Coming soon</Badge>
            </li>
            <li>
              NodeJS (sync via WebSockets, SQLite persistence){" "}
              <Badge>Coming soon</Badge>
            </li>
            <li>
              Swift, Kotlin, Rust <Badge>Coming soon</Badge>
            </li>
          </ul>
        </>
      }
    >
      {contentItems.map((item, index) => (
        <Card key={index} theme="toolkit">
          <CardMetaHeading theme="toolkit">
            {item.metadata.title}
          </CardMetaHeading>
          <div className="prose prose-sm code-simple">
            <CustomMDX source={item.content} />
          </div>
        </Card>
      ))}
    </PackagesSection>
  </>
);
