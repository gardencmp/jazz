import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import Link from "next/link";

const features = [
  {
    title: "Instant updates",
    icon: "instant",
  },
  {
    title: "Real-time sync",
    icon: "devices",
  },
  {
    title: "Multiplayer",
    icon: "spatialPresence",
  },
  {
    title: "File uploads",
    icon: "upload",
  },
  {
    title: "Social features",
    icon: "social",
  },
  {
    title: "Permissions",
    icon: "permissions",
  },
  {
    title: "E2E encryption",
    icon: "encryption",
  },
  {
    title: "Authentication",
    icon: "auth",
  },
];

export function HeroSection() {
  return (
    <div className="container grid gap-x-8 gap-y-10 py-12 md:py-16 lg:py-24 lg:gap-0 lg:grid-cols-3">
      <div className="flex flex-col justify-center gap-4 lg:col-span-3 lg:gap-8">
        <p className="uppercase text-blue tracking-widest text-sm font-medium dark:text-stone-400">
          Local-first development toolkit
        </p>
        <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter">
          <span className="inline-block">Ship top-tier apps</span>{" "}
          <span className="inline-block">at high tempo.</span>
        </h1>

        <Prose size="lg" className="text-pretty max-w-2xl dark:text-stone-200">
          <p>
            Jazz is a framework for building local-first apps
            &mdash;&nbsp;an&nbsp;architecture that lets companies like Figma and
            Linear play in a league of their own.
          </p>
          <p>
            Open source. Self-host or use{" "}
            <Link className="text-reset" href="/cloud">
              Jazz Cloud
            </Link>{" "}
            for zero-config magic.
          </p>
        </Prose>

        <div className="grid grid-cols-2 gap-2 max-w-3xl sm:grid-cols-4 sm:gap-4">
          {features.map(({ title, icon }) => (
            <div
              key={title}
              className="flex text-xs sm:text-sm gap-2 items-center"
            >
              <span className="text-blue p-1.5 rounded-lg bg-blue-50 dark:text-blue-500 dark:bg-stone-900">
                <Icon size="xs" name={icon} />
              </span>
              <p>{title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
