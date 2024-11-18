import {
  SiBluesky,
  SiGithub,
  SiLinkedin,
  SiX,
} from "@icons-pack/react-simple-icons";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { GlobeIcon, LucideIcon } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  name: string;
  titles: string[];
  image?: string;
  location: string;
  x?: string;
  github?: string;
  website?: string;
  linkedin?: string;
  bluesky?: string;
}

const team: Array<TeamMember> = [
  {
    name: "Anselm Eickhoff",
    titles: ["Founder"],
    image: "anselm.jpg",
    location: "Canterbury, UK ",
    x: "anselm_io",
    github: "aeplay",
    website: "http://anselm.io",
    bluesky: "anselm.io",
  },
  {
    name: "Andrei Popa",
    titles: ["Full-Stack Dev", "Infra"],
    image: "andrei.jpeg",
    location: "Bucharest, Romania ",
    x: "elitepax",
    github: "pax-k",
  },
  {
    name: "Guido D'Orsi",
    titles: ["Frontend Dev", "React Performance"],
    image: "guido.jpeg",
    location: "Piano di Sorrento, Italy ",
    github: "gdorsi",
  },
  {
    name: "Trisha Lim",
    titles: ["Frontend Dev", "Design", "Marketing"],
    image: "trisha.png",
    location: "Lisbon, Portugal ",
    github: "trishalim",
    website: "https://trishalim.com",
  },
  {
    name: "Benjamin Leveritt",
    titles: ["Full-Stack Dev"],
    image: "benjamin.jpg",
    location: "Portsmouth, UK ",
    github: "bensleveritt",
  },
  {
    name: "Marina Orlova",
    titles: ["Full-Stack Dev"],
    location: "Tarragona, Spain ",
    linkedin: "marina-orlova-52a34394",
    github: "marinoska",
    image: "marina.jpeg",
  },
];

function SocialLink({
  link,
  label,
  icon: Icon,
}: {
  label: string;
  link: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={link} className="p-1 -m-1">
      <Icon size={16} />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

function Person({ person }: { person: TeamMember }) {
  const imageClassName = "size-24 shadow rounded-md bg-stone-100 sm:size-28 ";
  return (
    <div className="flex items-center gap-5">
      {person.image ? (
        <img src={`/team/${person.image}`} className={imageClassName} />
      ) : (
        <span className={imageClassName}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-full pt-5 h-full text-stone-300 dark:text-stone-700"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M4 22a8 8 0 1 1 16 0zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6s6 2.685 6 6s-2.685 6-6 6"
            />
          </svg>
        </span>
      )}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-lg leading-none font-semibold tracking-tight text-stone-900 dark:text-white">
          {person.name}
        </h3>
        <p className="text-sm leading-none text-gray-600 dark:text-stone-400">
          {person.titles.join(", ")}
        </p>
        <p className="text-sm leading-none text-gray-600 dark:text-stone-400">
          {person.location}
        </p>

        <div className="flex gap-2 mt-0.5">
          {person.website && (
            <SocialLink
              link={person.website}
              icon={GlobeIcon}
              label="Website"
            />
          )}
          {person.x && (
            <SocialLink
              link={`https://x.com/${person.x}`}
              icon={SiX}
              label="X profile"
            />
          )}
          {person.bluesky && (
            <SocialLink
              link={`https://bsky.app/profile/${person.bluesky}`}
              icon={SiBluesky}
              label="Bluesky profile"
            />
          )}
          {person.linkedin && (
            <SocialLink
              link={`https://www.linkedin.com/in/${person.linkedin}`}
              icon={SiLinkedin}
              label="Linkedin profile"
            />
          )}
          {person.github && (
            <SocialLink
              link={`https://github.com/${person.github}`}
              label="Github profile"
              icon={SiGithub}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <div className="container">
      <HeroHeader title="Meet the team" slogan="" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        {team.map((person) => (
          <Person key={person.name} person={person} />
        ))}
      </div>
    </div>
  );
}
