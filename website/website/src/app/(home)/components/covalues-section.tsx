import { APICard, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import clsx from "clsx";
import { ParsedContent } from "@/lib/mdx-types";

type Props = {
  dataStructures: ParsedContent;
  files: ParsedContent;
  perms: ParsedContent;
  title?: string;
};

export const CovaluesSection = ({
  dataStructures,
  files,
  perms,
  title,
}: Props) => (
  <>
    <div className="grid grid-cols-12 gap-w6">
      <div className="col-span-full lg:col-span-9 ml-[-0.2em]">
        {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
        {/* !text-accent-fill */}
        <h1 className="Text-subtitle text-fill-contrast !leading-[1.1]">
          {title}
        </h1>
        <h2 className="Text-subtitle text-solid !leading-[1.1]">
          Your new building blocks.
        </h2>
      </div>
      <div
        className={clsx(
          "col-span-full lg:col-span-8 text-large text-fill space-y-1",
        )}
      >
        <p className="">
          Based on CRDTs and public-key cryptography, CoValues…
        </p>
        <ul className="list-disc list-inside">
          <li>Can be read & edited like simple local JSON state</li>
          <li>Can be created anywhere, are automatically synced & persisted</li>
          <li>Always keep full edit history & author metadata</li>
          <li>Automatically resolve most conflicts</li>
        </ul>
      </div>
    </div>
    <div className="grid grid-cols-12 gap-w4 pt-1">
      <APICard>
        <CardMetaHeading>{dataStructures.metadata.title}</CardMetaHeading>
        <div className="prose prose-sm code-simple">
          <CustomMDX source={dataStructures.content} />
        </div>
      </APICard>
      <APICard>
        <CardMetaHeading>{files.metadata.title}</CardMetaHeading>
        <div className="prose prose-sm code-simple">
          <CustomMDX source={files.content} />
        </div>
      </APICard>
      <APICard>
        <CardMetaHeading>{perms.metadata.title}</CardMetaHeading>
        <div className="prose prose-sm code-simple">
          <CustomMDX source={perms.content} />
        </div>
      </APICard>
    </div>
  </>
);
