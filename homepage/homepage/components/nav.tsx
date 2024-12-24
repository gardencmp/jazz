import { ThemeToggle } from "@/components/ThemeToggle";
import { socials } from "@/lib/socials";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { DocNav } from "./docs/nav";

export function JazzNav() {
  return (
    <Nav
      mainLogo={<JazzLogo className="w-20 md:w-24" />}
      themeToggle={ThemeToggle}
      items={[
        { title: "Jazz Cloud", href: "/cloud" },
        {
          title: "Documentation",
          href: "/docs",
          items: [
            {
              icon: "docs",
              title: "Documentation",
              href: "/docs",
              description:
                "Get started with using Jazz by learning the core concepts, and going through guides.",
            },
            {
              icon: "code",
              title: "Example apps",
              href: "/examples",
              description:
                "Demo and source code for example apps built with Jazz.",
            },
            {
              icon: "package",
              title: "API reference",
              href: "/api-reference",
              description:
                "API references for packages like jazz-tools, jazz-react, and more.",
            },
          ],
        },
        {
          title: "Built with Jazz",
          href: "/showcase",
        },
        {
          title: "Blog",
          href: "https://garden.co/news",
          firstOnRight: true,
          newTab: true,
        },
        {
          title: "Releases",
          href: "https://github.com/garden-co/jazz/releases",
          newTab: true,
        },
      ]}
      socials={socials}
    />
  );
}
