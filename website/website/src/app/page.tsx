import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseFrontmatter } from "@/lib/mdx-utils";
import clsx from "clsx";
import fs from "fs/promises";
import path from "path";
import {
  CovaluesSection,
  HeroCards,
  ToolkitSection,
} from "./(home)/components";

const contentPath = "src/app/(home)/content";

const fileNames = [
  "covalues-datastructures",
  "covalues-files",
  "covalues-perms",
  "toolkit-autosub",
  "toolkit-cursors",
  "toolkit-auth",
  "toolkit-dbsync",
  "toolkit-upload",
  "toolkit-video",
];

async function getHomeContent() {
  const filePaths = fileNames.map((name) =>
    path.join(process.cwd(), `${contentPath}/${name}.mdx`),
  );

  const fileContents = await Promise.all(
    filePaths.map((filePath) => fs.readFile(filePath, "utf8")),
  );

  return Object.fromEntries(
    fileNames.map((name, index) => [
      name,
      parseFrontmatter(fileContents[index]),
    ]),
  );
}

export default async function HomePage() {
  const content = await getHomeContent();
  const covaluesContent = [
    "covalues-datastructures",
    "covalues-files",
    "covalues-perms",
  ].map((key) => content[key]);
  const toolkitContent = [
    "toolkit-auth",
    "toolkit-autosub",
    "toolkit-cursors",
    "toolkit-dbsync",
    "toolkit-upload",
    "toolkit-video",
  ].map((key) => content[key]);

  return (
    <div className="relative space-y-w24">
      <section className="container max-w-docs space-y-w12">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full lg:col-span-9 ml-[-0.2em]">
            {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
            {/* !text-accent-fill */}
            <h1 className="Text-super text-accent-fill">Instant sync.</h1>
            <h2 className="Text-super text-solid">
              Jazz is a new way to build apps with distributed state.
            </h2>
            {/* <h1 className="Text-super text-accent-fill">
              Instant sync.{" "}
              <span className="text-solid">
                Jazz is a new way to build apps with distributed state.
              </span>
            </h1> */}
          </div>
          <div className="space-y-2 col-span-full lg:col-span-8">
            <p className="text-large text-fill">
              Jazz is an open-source toolkit that replaces APIs, databases and
              message queues with a single new abstraction—“Collaborative
              Values”—distributed state with secure permissions built-in.
              {/* <span className="font-medium text-fill-contrast lg:table">
                …now work out-of-the-box.
              </span> */}
            </p>
            <p className="text-large text-fill">
              Features that used to take months now work out-of-the-box.
              <span className="font-medium text-fill-contrast lg:table">
                Hard things are easy now.
              </span>
            </p>
          </div>
        </header>
        <HeroCards />
      </section>

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
    </div>
  );
}

const tabStyle = clsx([
  "Text-subheading h-tab text-fill-contrast",
  "px-w8 rounded-t-lg",
  "border border-b-0",
  "data-[state=active]:bg-accent-background data-[state=active]:border-accent-background",
  "data-[state=inactive]:text-solid data-[state=inactive]:bg-canvas",
]);
