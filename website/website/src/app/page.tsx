import { Code, Pre, fileInnerStyle } from "@/components/mdx";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import config from "@/config";
import { getMdxData } from "@/lib/mdx-utils";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import {
  CovaluesSection,
  MeshSection,
  ToolkitSection,
} from "./(home)/components";

const contentDir = "src/app/(home)/content";

export default function HomePage() {
  const content = getMdxData(contentDir);
  // console.log(content);
  const covaluesContent = content.filter((item) =>
    item.slug.includes("covalues"),
  );
  const toolkitContent = content.filter((item) =>
    item.slug.includes("toolkit"),
  );

  return (
    <>
      <section className="container max-w-docs space-y-w12 pb-w24 pt-under-nav-content">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full ml-[-0.2em]">
            <h1 className="Text-super text-accent-fill">Instant sync.</h1>
            <h2 className="Text-super text-fill-contrast text-balance">
              Jazz is a new way to build apps with distributed state.
            </h2>
          </div>
          <div className="space-y-w6 col-span-full lg:col-span-10">
            <p className="text-xlarge text-fill text-balance">
              Jazz is an open-source toolkit that replaces APIs, databases and
              message queues with a single new abstraction—“Collaborative
              Values”—distributed state with secure permissions built-in.
              <span className="font-medium text-fill-contrast lg:table">
                {/* Features that used to take months now work out of the box. */}
                Jazz helps you do more by simplifying the necessities.
              </span>
            </p>
          </div>
          <div className="col-span-full space-y-w3">
            <hr className="border-black-a2" />
            <div className="flex items-center justify-between gap-w3">
              <div className="flex items-center gap-w3">
                <Link href="#quickstart">
                  <Button
                    size="sm"
                    variant="outline"
                    PrefixIcon={<ArrowDown className="size-em" />}
                  >
                    Quickstart
                  </Button>
                </Link>
                <Link href={config.GITHUB_URL}>
                  <Button
                    size="sm"
                    variant="outline"
                    PrefixIcon={<GitHubLogoIcon className="size-em" />}
                  >
                    Star it
                  </Button>
                </Link>
              </div>
              <div
                className={clsx(
                  "relative",
                  fileInnerStyle,
                  "!h-[34px] rounded-lg border bg-background pr-[36px]",
                  "[&_.ClipboardCopyContainer]:top-0 [&_.ClipboardCopyContainer]:right-0",
                )}
              >
                <Pre className="code-block pb-px">
                  <Code>npm install jazz-tools jazz-react</Code>
                </Pre>
              </div>
            </div>
          </div>
        </header>

        {/* DIAGRAM */}
        <div className="space-y-w8 lg:px-inset-2x">
          <Image
            priority
            src="/images/stack-diagram-opt.svg"
            alt="Stack diagram"
            width={992}
            height={992 * (474 / 955)}
            className="mx-auto w-full"
          />
          <div className="flex justify-between px-[6.5%]">
            <p className="font-medium">
              Legacy stack.{" "}
              <span className="text-solid font-normal">
                Code-heavy. Time-intensive.
              </span>
            </p>
            <p className="font-medium min-w-[36%]">
              Jazz stack.{" "}
              <span className="text-solid font-normal">
                Less code. Product focus.
              </span>
            </p>
          </div>
        </div>
      </section>

      <hr className="border-black-a1" />
      <section className="container max-w-docs space-y-w12 pb-w24 pt-under-nav-content">
        <div className="grid grid-cols-12 gap-w6">
          {/* flex flex-col justify-center */}
          <div className="col-span-6 mt-[0.5em]">
            <div className="lg:pr-inset-2x">
              <div className="relative">
                <Image
                  src="/images/features-diagram3.svg"
                  alt="Stack diagram"
                  width={484}
                  height={484 * (344 / 464)}
                  className="mx-auto w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-semibold text-center">
                    Hard things
                    <br />
                    are easy now.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-6 col-start-7 space-y-w6">
            <div className="col-span-full ml-[-0.2em]">
              <h1 className="Text-subsuper text-accent-fill">
                Features for free.
              </h1>
              <h2 className="Text-subsuper text-fill-contrast text-balance">
                Seamless integration. Effortless features.
              </h2>
            </div>
            <div className="space-y-2 col-span-full lg:col-span-11">
              <p className="text-xlarge text-fill text-balance">
                With Jazz’s simplified architecture, complex features like
                real-time multiplayer, cross-device sync, and built-in
                permissions are directly integrated directly into the framework,
                allowing developers to build sophisticated apps with much less
                effort.{" "}
                <span className="font-medium text-fill-contrast ">
                  Features that used to take months now work out of the box.
                  {/* …now work out-of-the-box. */}
                </span>
              </p>
            </div>
          </div>
        </div>
        {/* <HeroCards3 /> */}
      </section>

      {/* <hr className="border-guide-dark" /> */}
      {/* bg-cov-background-subtle is too yellowy */}
      {/* bg-background-subtle */}
      <section className="bg-background" id="quickstart">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <CovaluesSection contentItems={covaluesContent} />
        </div>
      </section>
      <hr className="border-guide-dark" />
      <section className="bg-background">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <ToolkitSection contentItems={toolkitContent} />
        </div>
      </section>
      <hr className="border-guide-dark" />
      <section className="bg-background">
        <div className="container max-w-docs space-y-w8 pt-w12 pb-w16">
          <MeshSection />
        </div>
      </section>
    </>
  );
}
