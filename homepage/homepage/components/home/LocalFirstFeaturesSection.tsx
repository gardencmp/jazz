import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { LabelledFeatureIcon } from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import {
  GaugeIcon,
  MonitorSmartphoneIcon,
  MousePointerSquareDashedIcon,
  WifiOffIcon,
} from "lucide-react";

export function LocalFirstFeaturesSection() {
  const features = [
    {
      title: "Offline-first",
      icon: WifiOffIcon,
      description: (
        <>
          Your app works seamlessly offline or on sketchy connections. When
          you&apos;re back online, your data is synced.
        </>
      ),
    },
    {
      title: "Instant updates",
      icon: GaugeIcon,
      description: (
        <>
          Since you&apos;re working with local state, your UI updates instantly.
          Just mutate data. No API calls and spinners.
        </>
      ),
    },
    {
      title: "Real-time sync",
      icon: MonitorSmartphoneIcon,
      description: (
        <>
          Every device with the same account will always have everything in
          sync.
        </>
      ),
    },
    {
      title: "Multiplayer",
      icon: MousePointerSquareDashedIcon,
      description: (
        <>
          Adding multiplayer is as easy as sharing synced data with other users.
          Quickly build user presence UI, like cursors.
        </>
      ),
    },
  ];
  return (
    <div>
      <SectionHeader
        title="Why local-first?"
        slogan={
          <>
            <p>
              With local-first, your data is stored locally, then synced to the
              server.
              <br /> This comes with the following benefits.
            </p>
          </>
        }
      />
      <GappedGrid cols={4}>
        {features.map(({ title, icon: Icon, description }) => (
          <LabelledFeatureIcon
            label={title}
            icon={Icon}
            explanation={description}
            key={title}
          ></LabelledFeatureIcon>
        ))}
      </GappedGrid>
    </div>
  );
}
