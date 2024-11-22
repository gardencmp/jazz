import { SiDiscord, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { GcmpLogo } from "gcmp-design-system/src/app/components/atoms/logos/GcmpLogo";
import { Footer } from "gcmp-design-system/src/app/components/organisms/Footer";

export function JazzFooter() {
  return (
    <Footer
      logo={<GcmpLogo monochrome className="w-32" />}
      companyName="Garden Computing, Inc."
      socials={[
        {
          href: "https://github.com/gardencmp/jazz",
          icon: <SiGithub className="w-5" />,
          label: "GitHub",
        },
        {
          href: "https://discord.gg/utDMjHYg42",
          icon: <SiDiscord className="w-5" />,
          label: "Discord",
        },
        {
          href: "https://x.com/jazz_tools",
          icon: <SiX className="w-5" />,
          label: "X",
        },
      ]}
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
          ],
        },
      ]}
    />
  );
}
