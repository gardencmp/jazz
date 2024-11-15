import { GcmpLogo } from "gcmp-design-system/src/app/components/atoms/logos/GcmpLogo";
import { Footer } from "gcmp-design-system/src/app/components/organisms/Footer";

export function JazzFooter() {
  return (
    <Footer
      logo={<GcmpLogo monochrome className="w-32" />}
      companyName="Garden Computing, Inc."
      sections={[
        {
          title: "Resources",
          links: [
            { href: "/", label: "Toolkit" },
            { href: "/cloud", label: "Jazz Cloud" },
            { href: "/docs", label: "Docs" },
          ],
        },
        {
          title: "Community",
          links: [
            {
              href: "https://github.com/gardencmp/jazz",
              label: "GitHub",
              newTab: true,
            },
            {
              href: "https://discord.gg/utDMjHYg42",
              label: "Discord",
              newTab: true,
            },
            {
              href: "https://x.com/jazz_tools",
              label: "X",
              newTab: true,
            },
          ],
        },
        {
          title: "News",
          links: [
            {
              href: "https://gcmp.io/news",
              label: "Blog",
              newTab: true,
            },
            {
              href: "https://github.com/gardencmp/jazz/releases",
              label: "Releases",
              newTab: true,
            },
            {
              href: "https://github.com/orgs/gardencmp/projects/4/views/3",
              label: "Roadmap",
              newTab: true,
            },
          ],
        },
      ]}
    />
  );
}
