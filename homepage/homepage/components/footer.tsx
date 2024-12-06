import { ThemeToggle } from "@/components/ThemeToggle";
import { socials } from "@/lib/socials";
import { GcmpLogo } from "gcmp-design-system/src/app/components/atoms/logos/GcmpLogo";
import { Footer } from "gcmp-design-system/src/app/components/organisms/Footer";

export function JazzFooter() {
  return (
    <Footer
      logo={<GcmpLogo monochrome className="w-36" />}
      companyName="Garden Computing, Inc."
      socials={socials}
      themeToggle={ThemeToggle}
      sections={[
        {
          title: "About",
          links: [
            {
              href: "https://garden.co/team",
              label: "Team",
              newTab: true,
            },
            {
              href: "https://garden.co/news",
              label: "Blog",
              newTab: true,
            },
            {
              href: "https://github.com/garden-co/jazz/releases",
              label: "Releases",
              newTab: true,
            },
          ],
        },
        {
          title: "Resources",
          links: [
            {
              href: "/docs",
              label: "Documentation",
            },
            {
              href: "/examples",
              label: "Examples",
            },
            {
              href: "/showcase",
              label: "Built with Jazz",
            },
          ],
        },
      ]}
    />
  );
}
