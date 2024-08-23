import {
  FileLock2Icon,
  GaugeIcon,
  HardDriveDownloadIcon,
  KeyRoundIcon,
  MonitorSmartphoneIcon,
  PlaneIcon,
  UploadCloudIcon,
  UsersIcon,
  MousePointerClick,
} from "lucide-react";
import clsx from "clsx";

export function HeroCards() {
  const featureGroup1 = features.slice(0, 4);
  const featureGroup2 = features.slice(4);
  return (
    <div className="lg:mx-[-3vw] relative">
      <p className="text-large font-medium px-w3 lg:px-[3vw] py-w6 gridLine-after gridLine-before bg-background">
        {/* Features that used to take months now work out of the box.{" "} */}
        <span className="text-accent-fill">Hard things are easy now.</span>
      </p>
      <div className="grid grid-cols-12 grid-rows-3 gap-2 gridLine-after">
        {featureGroup1.map((item) => (
          <Feature key={item.label} label={item.label} Icon={item.Icon} />
        ))}
      </div>
      <div className="grid grid-cols-12 grid-rows-3 gap-2 gridLine-after">
        {featureGroup2.map((item) => (
          <Feature key={item.label} label={item.label} Icon={item.Icon} />
        ))}
      </div>
      <div className="gridLine-vertical left-0 z-10"></div>
      <div className="gridLine-vertical right-0 z-10"></div>
      {/* <div className="grid grid-cols-12 grid-rows-3 gap-2 gridLine-after">
        {features.map((item, index) => (
          // index === 4 ? (
          //   <FeatureCard key={item.label}>
          //     <p className="text-base font-bold text-accent-fill text-center">
          //       Hard things are easy now.
          //     </p>
          //   </FeatureCard>
          // ) : (
          //   <Feature key={item.label} label={item.label} Icon={item.Icon} />
          // ),
          <Feature key={item.label} label={item.label} Icon={item.Icon} />
        ))}
      </div> */}
    </div>
  );
}
export function HeroCards2() {
  const featureGroup1 = features.slice(0, 4);
  const featureGroup2 = features.slice(4);
  return (
    <div className="relative">
      {/* <p className="text-large font-medium px-w3 lg:px-[3vw] py-w6  bg-background">
        <span className="text-accent-fill">Hard things are easy now.</span>
      </p> */}
      <div className="grid grid-cols-12 grid-rows-3 gap-2">
        {featureGroup1.map((item) => (
          <Feature key={item.label} label={item.label} Icon={item.Icon} />
        ))}
      </div>
      <div className="grid grid-cols-12 grid-rows-3 gap-2">
        {featureGroup2.map((item) => (
          <Feature key={item.label} label={item.label} Icon={item.Icon} />
        ))}
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "flex items-center justify-center rounded-lg bg-canvas",
      // "bg-background-hover",
      // "border bg-canvas",
      // "col-span-4 row-span-1 px-w8 py-w6", // px-w4 py-w3
      "col-span-3 row-span-3 px-w3 py-w6",
      // "outline outline-1 outline-accent-fill",
      className,
    )}
  >
    <div className="flex flex-col gap-2.5 items-center justify-center">
      {children}
    </div>
  </div>
);

const Feature = ({
  label,
  Icon,
}: {
  label: string;
  Icon: React.ComponentType<any>;
}) => {
  return (
    <FeatureCard>
      <Icon
        strokeWidth={1.5}
        strokeLinecap="butt"
        // size={40}
        className="size-[3em] text-accent"
      />
      <p
        className={clsx(
          "Text-meta text-center",
          // "text-base font-bold",
          "text-fill-contrast",
        )}
      >
        {label}
      </p>
    </FeatureCard>
  );
};

const features = [
  {
    Icon: MonitorSmartphoneIcon,
    label: "Cross-device sync",
  },
  {
    Icon: MousePointerClick,
    label: "Real-time multiplayer",
  },
  {
    Icon: UsersIcon,
    label: "Team/social features",
  },
  {
    Icon: FileLock2Icon,
    label: "Built-in permissions",
  },
  // {
  //   Icon: FileLock2Icon,
  //   label: "CUSTOM",
  // },
  {
    Icon: UploadCloudIcon,
    label: "Cloud sync & storage",
  },
  {
    Icon: HardDriveDownloadIcon,
    label: "On-device storage",
  },
  {
    Icon: GaugeIcon,
    label: "Instant UI updates",
  },
  {
    Icon: KeyRoundIcon,
    label: "E2EE & signatures",
  },
];
