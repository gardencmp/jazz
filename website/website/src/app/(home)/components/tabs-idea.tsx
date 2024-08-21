import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParsedContent } from "@/lib/mdx-types";
import clsx from "clsx";
import { CovaluesSection, ToolkitSection } from "./index";

const tabStyle = clsx([
  "Text-subheading h-tab text-fill-contrast",
  "px-w8 rounded-t-lg",
  "border border-b-0",
  "data-[state=active]:bg-accent-background data-[state=active]:border-accent-background",
  "data-[state=inactive]:text-solid data-[state=inactive]:bg-canvas",
]);

type Props = {
  toolkitContent: ParsedContent[];
  covaluesContent: ParsedContent[];
};

export const TabsIdea = ({ toolkitContent, covaluesContent }: Props) => (
  <section className="">
    <Tabs defaultValue="Toolkit">
      <TabsList className="container max-w-docs space-x-[-2px] z-10">
        <TabsTrigger value="Toolkit" className={tabStyle}>
          What is Toolkit?
        </TabsTrigger>
        <TabsTrigger
          value="CoValues"
          className={clsx(
            tabStyle,
            "data-[state=active]:bg-background data-[state=active]:border-background",
          )}
        >
          What are CoValues?
        </TabsTrigger>
      </TabsList>

      <TabsContent value="Toolkit" className="space-y-w8">
        <div className="bg-accent-background py-w12 -mt-px">
          <div className="container max-w-docs space-y-w8">
            <ToolkitSection contentItems={toolkitContent} />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="CoValues" className="space-y-w8">
        <div className="bg-background py-w12 -mt-px">
          <div className="container max-w-docs space-y-w8">
            <CovaluesSection contentItems={covaluesContent} />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </section>
);
