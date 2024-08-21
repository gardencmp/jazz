import { Card, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { ParsedContent } from "@/lib/mdx-types";
import { PackagesSection } from "@/components/layout";

type Props = {
  contentItems: ParsedContent[];
};

export const CustomSection = ({ contentItems }: Props) => (
  <>
    <PackagesSection
      theme="mesh"
      heading="Custom Deployment Scenarios"
      subheading="You can rely on Jazz Mesh. But you don't have to."
      link="/docs"
      description={
        <p className="text-balance">
          Because Jazz is open-source, you can optionally run your own sync
          nodes — in a variety of setups.
        </p>
      }
    >
      {contentItems.map((item, index) => (
        <Card key={index} theme="covalues">
          <CardMetaHeading theme="covalues">
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
