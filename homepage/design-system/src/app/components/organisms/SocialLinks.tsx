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
    size: 20,
  },
  {
    name: "Discord",
    icon: SiDiscord,
    key: "discord",
    size: 23,
  },
  {
    name: "X",
    icon: SiX,
    key: "x",
    size: 18,
  },
];

export function SocialLinks(props: SocialLinksProps & { className?: string }) {
  return (
    <div className={clsx(props.className, "inline-flex gap-6 items-center")}>
      {socials.map(
        (social) =>
          props[social.key as keyof SocialLinksProps] && (
            <a
              key={social.key}
              href={props[social.key as keyof SocialLinksProps]}
              target="_blank"
              rel="noreferrer"
              className="flex hover:text-stone-900 hover:dark:text-white"
            >
              <social.icon size={social.size} />
              <span className="sr-only">{social.name}</span>
            </a>
          ),
      )}
    </div>
  );
}
