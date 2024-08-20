import { APICard, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { ParsedContent } from "@/lib/mdx-types";
import { PackagesSection } from "./packages-section";

type Props = {
  contentItems: ParsedContent[];
};

export const CovaluesSection = ({ contentItems }: Props) => (
  <>
    <PackagesSection
      heading="Collaborative Values"
      subheading="Your new building blocks."
      description={
        <>
          <p className="">
            Based on CRDTs and public-key cryptography, CoValues…
          </p>
          <ul className="list-disc list-inside">
            <li>Can be read & edited like simple local JSON state</li>
            <li>
              Can be created anywhere, are automatically synced & persisted
            </li>
            <li>Always keep full edit history & author metadata</li>
            <li>Automatically resolve most conflicts</li>
          </ul>
        </>
      }
    >
      {contentItems.map((item, index) => (
        <APICard key={index} theme="covalues">
          <CardMetaHeading theme="covalues">
            {item.metadata.title}
          </CardMetaHeading>
          <div className="prose prose-sm code-simple">
            <CustomMDX source={item.content} />
          </div>
        </APICard>
      ))}
    </PackagesSection>
  </>
);
