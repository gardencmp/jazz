import { APICard, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { parseFrontmatter } from "@/lib/mdx-utils";
import clsx from "clsx";
import fs from "fs/promises";
import {
  FileLock2Icon,
  GaugeIcon,
  HardDriveDownloadIcon,
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  PlaneIcon,
  UploadCloudIcon,
  UsersIcon,
} from "lucide-react";
import path from "path";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CovaluesSection } from "./(home)/components/covalues-section";

async function getHomeContent() {
  const dataStructuresPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-datastructures.mdx",
  );
  const filesPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-files.mdx",
  );
  const permsPath = path.join(
    process.cwd(),
    "src/app/(home)/content/covalues-perms.mdx",
  );

  const [source1, source2, source3] = await Promise.all([
    fs.readFile(dataStructuresPath, "utf8"),
    fs.readFile(filesPath, "utf8"),
    fs.readFile(permsPath, "utf8"),
  ]);

  const dataStructures = parseFrontmatter(source1);
  const files = parseFrontmatter(source2);
  const perms = parseFrontmatter(source3);

  return { dataStructures, files, perms };
}

export default async function HomePage() {
  const { dataStructures, files, perms } = await getHomeContent();

  return (
    <div className="relative space-y-w24">
      <section className="container max-w-docs space-y-w12">
        <header className="grid grid-cols-12 gap-w6">
          <div className="col-span-full lg:col-span-9 ml-[-0.2em]">
            {/* <PixelarticonsFileAlt className="text-[2em] text-accent-fill transform translate-y-[-1px]" /> */}
            {/* !text-accent-fill */}
            <h1 className="Text-super text-accent-fill">Instant sync.</h1>
            <h2 className="Text-super text-solid">
              Jazz is a new way to build apps with distributed state.
            </h2>
            {/* <h1 className="Text-super text-accent-fill">
              Instant sync.{" "}
              <span className="text-solid">
                Jazz is a new way to build apps with distributed state.
              </span>
            </h1> */}
          </div>
          <p
            className={clsx("col-span-full lg:col-span-8 text-large text-fill")}
          >
            Jazz is an open-source toolkit that replaces APIs, databases and
            message queues with a single new abstraction—“Collaborative
            Values”—distributed state with secure permissions built-in. Features
            that used to take months…
            <span className="font-medium text-fill-contrast lg:table">
              …now work out-of-the-box.
            </span>
          </p>
        </header>
        <div className="grid grid-cols-12 grid-rows-3 gap-1.5">
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
        </div>
      </section>

      <section className="">
        <Tabs defaultValue="account" className="">
          <TabsList className="container max-w-docs">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>

          <div className="bg-background-subtle py-w12">
            <div className="container max-w-docs space-y-w8">
              <TabsContent value="account" className="space-y-w8">
                <CovaluesSection
                  title="Collaborative Values"
                  dataStructures={dataStructures}
                  files={files}
                  perms={perms}
                />
              </TabsContent>
              <TabsContent value="password" className="space-y-w8">
                <CovaluesSection
                  title="Tab 2 title"
                  dataStructures={dataStructures}
                  files={files}
                  perms={perms}
                />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </section>
    </div>
  );
}

const FeatureCard = ({ children }: { children: React.ReactNode }) => (
  <div className="col-span-4 row-span-1 bg-background-hover flex items-center justify-center rounded-lg px-w8 py-w6">
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
      <IconComponent
        strokeWidth={1}
        strokeLinecap="butt"
        // size={40}
        className="size-[2em] text-solid-lite"
      />
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
