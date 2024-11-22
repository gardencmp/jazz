import { SiDiscord, SiGithub, SiX } from "@icons-pack/react-simple-icons";
import { clsx } from "clsx";

export interface SocialLinksProps {
  github?: string;
  x?: string;
  discord?: string;
}

const socials = [
  {
    name: "Github",
    icon: SiGithub,
    key: "github",
  },
  {
    name: "Discord",
    icon: SiDiscord,
    key: "discord",
  },
  {
    name: "X",
    icon: SiX,
    key: "x",
  },
];

export function SocialLinks(props: SocialLinksProps & { className?: string }) {
  return (
    <div className={clsx(props.className, "flex gap-6 ")}>
      {socials.map(
        (social) =>
          props[social.key as keyof SocialLinksProps] && (
            <a
              key={social.key}
              href={props[social.key as keyof SocialLinksProps]}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-stone-900 hover:dark:text-white"
            >
              <social.icon className="w-5" />
              <span className="sr-only">{social.name}</span>
            </a>
          ),
      )}
    </div>
  );
}
