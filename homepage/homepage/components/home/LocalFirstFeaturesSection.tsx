import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import {
    GaugeIcon,
    MonitorSmartphoneIcon,
    MousePointerSquareDashedIcon,
    WifiOffIcon,
} from "lucide-react";
import { LabelledFeatureIcon } from "gcmp-design-system/src/app/components/molecules/LabelledFeatureIcon";

export function LocalFirstFeaturesSection() {
    const features = [
        {
            title: "Offline-first",
            icon: WifiOffIcon,
            description: (
                <>
                    Your app works seamlessly offline or on sketchy connections.
                    When you&apos;re back online, your data is synced.
                </>
            ),
        },
        {
            title: "Instant updates",
            icon: GaugeIcon,
            description: (
                <>
                    Since you&apos;re working with local state, your UI updates
                    instantly. Just mutate data the JSON object. No API calls
                    and spinners.
                </>
            ),
        },
        {
            title: "Real-time sync",
            icon: MonitorSmartphoneIcon,
            description: (
                <>
                    Every device with the same account will always have
                    everything in sync.
                </>
            ),
        },
        {
            title: "Multiplayer",
            icon: MousePointerSquareDashedIcon,
            description: (
                <>
                    Adding multiplayer is as easy as sharing state with other
                    users. Quickly build user presence UI, like cursors.
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
                            With local-first, your data is stored locally, then
                            synced to the server.
                            <br /> This comes with the following benefits.
                        </p>
                    </>
                }
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                {features.map(({ title, icon: Icon, description }) => (
                    <LabelledFeatureIcon
                        label={title}
                        icon={Icon}
                        explanation={description}
                        key={title}
                    ></LabelledFeatureIcon>
                ))}
            </div>
        </div>
    );
}
