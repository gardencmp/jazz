import { CardSecondary, HeadingLinkCaret } from "@/components/card";
import { SectionSecondary } from "@/components/layout";
import { Code, File, Pre } from "@/components/mdx";
import { Link } from "@/components/ui/link";
import { MdxData } from "@/lib/mdx-types";
import { ClockIcon } from "lucide-react";
import { guideExamples } from "../guides/(content)/guide-examples";
import clsx from "clsx";

/* {quickstartDoc.metadata.title} */
/* Set up your environment and make your first API request in minutes */

export const DocsIndexPage = ({
  quickstartDoc,
}: {
  quickstartDoc: MdxData;
}) => {
  return (
    <div className="relative container max-w-docs space-y-w8 pb-under-content pt-under-nav-content">
      <header className="grid grid-cols-12 gap-2">
        <div className="col-span-12 flex items-center gap-1.5">
          <h1 className="Text-title text-fill-contrast !leading-none">
            Jazz Docs
          </h1>
        </div>
        <p className="col-span-12 max-w-[400px] text-large text-fill">
          Learn how to get up and running with Jazz through tutorials, APIs and
          other resources.
        </p>
      </header>

      <div className={clsx("PageContainer space-y-w8")}>
        <SectionSecondary title="Guides" className="grid-rows-3 gap-2.5">
          <Link
            key={quickstartDoc.slug}
            href={`/docs/guides/${quickstartDoc.slug}`}
            className={clsx(
              "col-span-full lg:col-span-8 lg:row-span-3",
              "group flex flex-col gap-inset",
              "bg-background rounded-lg overflow-hidden",
              "transition-colors duration-200 hover:bg-background-active",
              "[&:hover_.File]:bg-background-active [&_.File]:transition-colors [&_.File]:duration-200",
              // "hover:outline hover:outline-solid outline-transparent outline-[1px]",
            )}
          >
            <div className="grow px-w6 py-w8 flex flex-col gap-w8">
              <div className="shrink-0 space-y-2 text-fill-contrast">
                <h2 className="Text-heading flex items-center">
                  Developer quickstart
                  <HeadingLinkCaret />
                </h2>
                <div className="text-small">
                  Learn Jazz by building an issue tracker with distributed state
                </div>
                <div className="shrink flex items-center gap-1 text-small text-fill">
                  <ClockIcon className="size-[0.8em]" />
                  <div className="leading-none">10 min</div>
                </div>
              </div>

              <div className="grow flex flex-col items-center justify-center">
                <GuideArt />
              </div>
            </div>
          </Link>

          {guideExamples.map((item) => (
            <CardSecondary
              key={item.link}
              link={item.link}
              heading={item.name}
              description={item.summary}
              className="col-span-4 min-h-[130px]"
            />
          ))}
        </SectionSecondary>

        <SectionSecondary title="API" className={clsx("gap-2.5 grid-rows-2")}>
          {apis
            .filter((item) => item.level === 1)
            .map((item) => (
              <CardSecondary
                key={item.link}
                link={item.link}
                heading={item.name}
                description={item.summary}
                theme="package"
                className="col-span-4 min-h-[200px]"
              />
            ))}
          {apis
            .filter((item) => item.level === 2)
            .map((item) => (
              <CardSecondary
                key={item.link}
                link={`/docs/api/${item.link}`}
                heading={item.name}
                description={item.summary}
                theme="package"
                className="col-span-4 min-h-[130px]"
              />
            ))}
        </SectionSecondary>
      </div>
    </div>
  );
};

const GuideArt = () => (
  <div className="prose [&_.File]:!my-0">
    <File theme="light" className="border-none">
      <Pre showCopyAction={false}>
        <Code language="tsx">{`import { createJazzReactContext, DemoAuth } from "jazz-react";
const Jazz = createJazzReactContext({
  auth: DemoAuth({ appName: "Circular" }),
  peer: "wss://mesh.jazz.tools/?key=you@example.com",
  });
export const { useAccount, useCoState } = Jazz;`}</Code>
      </Pre>
    </File>
  </div>
);

const apis = [
  {
    level: 1,
    name: "jazz-tools",
    summary: "Summary TODO",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    level: 1,
    name: "jazz-react",
    summary: "Summary TODO",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    level: 1,
    name: "jazz-browser",
    summary: "Summary TODO",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    level: 2,
    name: "jazz-browser-media-images",
    summary: "Summary TODO",
    link: "jazz-browser-media-images",
  },
];
