import { SiDiscord, SiGithub, SiX } from "@icons-pack/react-simple-icons";

type NavItem = {
  href: string;
  icon?: React.ReactNode;
  title: string;
  firstOnRight?: boolean;
  newTab?: boolean;
};

export const primaryItems: NavItem[] = [
  { title: "Toolkit", href: "/" },
  // Sync & Storage
  { title: "Mesh", href: "/mesh" },
  {
    title: "Docs",
    href: "/docs",
  },
];

export const secondaryItems: NavItem[] = [
  {
    title: "Blog",
    href: "https://gcmp.io/news",
    newTab: true,
  },
  {
    title: "Releases",
    href: "https://github.com/gardencmp/jazz/releases",
    newTab: true,
  },
  {
    title: "Roadmap",
    href: "https://github.com/orgs/gardencmp/projects/4/views/3",
    newTab: true,
  },
];

export const socialLinks: NavItem[] = [
  {
    title: "GitHub",
    href: "https://github.com/gardencmp/jazz",
    newTab: true,
    icon: <SiGithub className="size-em" />,
  },
  {
    title: "Discord",
    href: "https://discord.gg/utDMjHYg42",
    newTab: true,
    icon: <SiDiscord className="size-em" />,
  },
  {
    title: "X",
    href: "https://x.com/jazz_tools",
    newTab: true,
    icon: <SiX className="size-em" />,
  },
];
