import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { BookTextIcon, BoxIcon, CodeIcon } from "lucide-react";
import { DocNav } from "./docs/nav";

export function JazzNav() {
  return (
    <Nav
      mainLogo={<JazzLogo className="w-24" />}
      items={[
        { title: "Jazz Cloud", href: "/cloud" },
        {
          title: "Documentation",
          href: "/docs",
          items: [
            {
              icon: (
                <BookTextIcon
                  className="size-5 stroke-blue dark:stroke-blue-500 shrink-0"
                  strokeWidth={1.5}
                />
              ),
              title: "Documentation",
              href: "/docs",
              description:
                "Get started with using Jazz by learning the core concepts, and going through guides.",
            },
            {
              icon: (
                <BoxIcon
                  className="size-5 stroke-blue dark:stroke-blue-500 shrink-0"
                  strokeWidth={1.5}
                />
              ),
              title: "API reference",
              href: "/docs/api-reference",
              description:
                "API references for packages like jazz-tools, jazz-react, and more.",
            },
            {
              icon: (
                <CodeIcon
                  className="size-5 stroke-blue dark:stroke-blue-500 shrink-0"
                  strokeWidth={1.5}
                />
              ),
              title: "Example apps",
              href: "/docs/examples",
              description:
                "Demo and source code for example apps built with Jazz.",
            },
          ],
        },
        {
          title: "Built with Jazz",
          href: "/showcase",
        },
        {
          title: "Blog",
          href: "https://gcmp.io/news",
          firstOnRight: true,
          newTab: true,
        },
        {
          title: "Releases",
          href: "https://github.com/gardencmp/jazz/releases",
          newTab: true,
        },
      ]}
      cta={
        <Button href="https://discord.gg/utDMjHYg42" variant="primary">
          <span>Join Discord</span>
        </Button>
      }
      docNav={<DocNav className="block h-auto" />}
    />
  );
}
