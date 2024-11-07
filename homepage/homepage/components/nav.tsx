import { SiDiscord, SiGithub, SiTwitter } from "@icons-pack/react-simple-icons";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
import { JazzLogo } from "gcmp-design-system/src/app/components/atoms/logos/JazzLogo";
import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
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
              title: "Documentation",
              href: "/docs",
            },
            {
              title: "API reference",
              href: "/docs/api-reference",
            },
            {
              title: "Example apps",
              href: "/docs/examples",
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
        // {
        //   title: "GitHub",
        //   href: "https://github.com/gardencmp/jazz",
        //   newTab: true,
        //   icon: <SiGithub className="w-5" />,
        // },
        // {
        //   title: "Discord",
        //   href: "https://discord.gg/utDMjHYg42",
        //   newTab: true,
        //   icon: <SiDiscord className="w-5" />,
        // },
        // {
        //   title: "X",
        //   href: "https://x.com/jazz_tools",
        //   newTab: true,
        //   icon: <SiTwitter className="w-5" />,
        // },
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
