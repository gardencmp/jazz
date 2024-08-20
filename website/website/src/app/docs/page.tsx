import { notFound } from "next/navigation";
import { Link } from "@/components/ui/link";
import { getDocPosts } from "@/lib/mdx-utils";
import clsx from "clsx";
import { PixelarticonsFileAlt, PixelarticonsClock } from "@/components/icons";
import {
  ClockIcon,
  CaretRightIcon,
  ArrowTopRightIcon,
  GitHubLogoIcon,
  CubeIcon,
} from "@radix-ui/react-icons";
import { File, Pre, Code } from "@/components/mdx/mdx-components";
import { CardSecondary, HeadingLinkCaret } from "@/components/card";

export const metadata = {
  title: "jazz - Docs",
  description: "Jazz Guide, FAQ & Docs.",
};

export default function DocsIndexPage() {
  const allDocs = getDocPosts();
  const quickstart = allDocs.find((doc) => doc.slug === "guide");

  if (!quickstart) {
    notFound();
  }

  return (
    <div className="relative container max-w-docs space-y-w8 pb-under-content">
      <header className="grid grid-cols-12 gap-2">
        <div className="col-span-12 flex items-center gap-1.5">
          {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
          {/* !text-accent-fill */}
          <h1 className="Text-title text-fill-contrast !leading-none">
            Jazz Docs
          </h1>
        </div>
        <p
          className={clsx("col-span-12 max-w-[400px]", "text-large text-fill")}
        >
          Learn how to get up and running with Jazz through tutorials, APIs and
          other resources.
        </p>
      </header>

      <div className={clsx("PageContainer space-y-w8")}>
        <Section
          title="Guides"
          className={clsx(
            // "gap-x-2.5 gap-y-w4",
            "grid-rows-3 gap-2.5",
          )}
        >
          <Link
            key={quickstart.slug}
            href={`/docs/${quickstart.slug}`}
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
              <div className="shrink-0 space-y-1 text-fill-contrast">
                <div className="Text-heading flex items-center">
                  Developer quickstart
                  <HeadingLinkCaret />
                </div>
                <div className="text-small">
                  {/* {quickstart.metadata.title} */}
                  {/* Set up your environment and make your first API request in
                  minutes */}
                  Learn Jazz by building an issue tracker with distributed state
                </div>
                <div className="shrink flex items-center gap-1.5 text-small !mt-2">
                  <ClockIcon className="size-em" />
                  <div className="leading-none">10 min</div>
                </div>
              </div>

              <div className="grow flex flex-col items-center justify-center">
                <GuideArt />
              </div>
            </div>
          </Link>

          {examples.map((item) => (
            <CardSecondary
              key={item.link}
              link={item.link}
              heading={item.name}
              description={item.summary}
              className={clsx(
                // "col-span-4",
                "col-span-4 min-h-[130px]",
              )}
            />
          ))}
        </Section>

        <Section title="API" className={clsx("gap-2.5")}>
          {apis.map((item) => (
            <CardSecondary
              key={item.link}
              link={item.link}
              heading={item.name}
              description={item.summary}
              theme="package"
              className={clsx(
                "col-span-4 min-h-[200px]",
                // "col-span-3",
              )}
            />
          ))}
        </Section>
      </div>
    </div>
  );
}

const Section = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className="space-y-w4">
    <div className="space-y-2">
      <h1 className="Text-meta text-fill-contrast leading-none">{title}</h1>
      <hr className="border-lin" />
    </div>
    <div className={clsx("grid grid-cols-12", className)}>
      {children}
      {/* <div className="flex flex-col gap-inset h-[420px] border rounded-lg">
        <h2 className="Text-heading !text-solid mt-auto p-w4">
          More coming soon…
        </h2>
      </div> */}
    </div>
  </div>
);

const GuideArt = () => (
  <div className="prose [&_.File]:!my-0">
    <File theme="light" className="border-none">
      <Pre showCopyAction={false}>
        <Code language="tsx">{`import { createJazzReactContext, DemoAuth } from "jazz-react";
const Jazz = createJazzReactContext({
  auth: DemoAuth({ appName: "Circular" }),
  peer: "wss://mesh.jazz.tools/?key=you@example.com",
  });
  export const { useAccount, useCoState } = Jazz;
  `}</Code>
      </Pre>
    </File>
  </div>
);

const examples = [
  {
    name: "Chat",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    name: "Pets",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    name: "Inspector",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
];

const apis = [
  {
    name: "jazz-tools",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    name: "jazz-react",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
  {
    name: "jazz-browser",
    summary: "Build an issue tracker with distributed state in 15 minutes.",
    link: "https://github.com/gardencmp/jazz/blob/main/examples/todo/README.md",
  },
];
