import Image from "next/image";
import clsx from "clsx";
import {
  WorkflowIcon,
  UploadCloudIcon,
  PlaneIcon,
  MonitorSmartphoneIcon,
  GaugeIcon,
  UsersIcon,
  FileLock2Icon,
  HardDriveDownloadIcon,
  KeyRoundIcon,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative container max-w-docs space-y-w12">
      <header className="grid grid-cols-12 gap-w6">
        <div className="col-span-full lg:col-span-9">
          {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
          {/* !text-accent-fill */}
          <h1 className="Text-super text-accent-fill">Instant sync.</h1>
          <h2 className="Text-super text-solid">
            Jazz is a new way to build apps with distributed state.
          </h2>
        </div>
        <p className={clsx("col-span-full lg:col-span-8 text-large text-fill")}>
          Jazz is an open-source toolkit that replaces APIs, databases and
          message queues with a single new abstraction: “Collaborative
          Values”—distributed state with secure permissions built-in. Features
          that used to take months…
          <span className="font-medium text-fill-contrast lg:table">
            …now work out-of-the-box.
          </span>
        </p>
      </header>

      <section className="grid grid-cols-12 grid-rows-3 gap-1.5">
        {features.map((item, index) =>
          index === 4 ? (
            <FeatureCard key={item.icon}>
              <p className="text-base font-bold text-accent-fill text-center">
                Hard things are easy now.
              </p>
            </FeatureCard>
          ) : (
            <Feature
              key={item.icon}
              label={item.label}
              icon={item.icon}
              className="col-span-4"
            />
          ),
        )}
      </section>
    </div>
  );
}

const FeatureCard = ({ children }: { children: React.ReactNode }) => (
  <div className="col-span-4 row-span-1 bg-background flex items-center justify-center rounded-lg px-w8 py-w6">
    <div className="flex flex-col gap-2.5 items-center justify-center">
      {children}
    </div>
  </div>
);

const Feature = ({
  label,
  icon,
  className,
}: {
  label: string;
  icon: keyof typeof iconMap;
  className?: string;
}) => {
  const IconComponent = iconMap[icon];
  return (
    <FeatureCard>
      <IconComponent className="size-[2em] text-solid-lite" />
      <p className="text-base font-bold text-fill-contrast">{label}</p>
    </FeatureCard>
  );
};

const iconMap = {
  "monitor-smartphone": MonitorSmartphoneIcon,
  send: PlaneIcon,
  users: UsersIcon,
  "file-lock2": FileLock2Icon,
  "upload-cloud": UploadCloudIcon,
  "hard-drive-download": HardDriveDownloadIcon,
  gauge: GaugeIcon,
  "key-round": KeyRoundIcon,
};

const features = [
  {
    icon: "monitor-smartphone" as const,
    label: "Cross-device sync",
  },
  {
    icon: "send" as const,
    label: "Real-time multiplayer",
  },
  {
    icon: "users" as const,
    label: "Team/social features",
  },
  {
    icon: "file-lock2" as const,
    label: "Built-in permissions",
  },
  {
    icon: "file-lock2" as const,
    label: "CUSTOM",
  },
  {
    icon: "upload-cloud" as const,
    label: "Cloud sync & storage",
  },
  {
    icon: "hard-drive-download" as const,
    label: "On-device storage",
  },
  {
    icon: "gauge" as const,
    label: "Instant UI updates",
  },
  {
    icon: "key-round" as const,
    label: "E2EE & signatures",
  },
];
