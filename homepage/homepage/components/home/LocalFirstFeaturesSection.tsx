import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import {
    GaugeIcon,
    MonitorSmartphoneIcon,
    MousePointerSquareDashedIcon,
    WifiOffIcon,
} from "lucide-react";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

export function LocalFirstFeaturesSection() {
    const features = [
        {
            title: "Offline-first",
            icon: WifiOffIcon,
            description: (
                <>
                    Your app works seamlessly offline or on sketchy connections.
                    When you&apos;re online, your data is synced.
                </>
            ),
        },
        {
            title: "Instant updates",
            icon: GaugeIcon,
            description: (
                <>
                    Since you&apos;re working with local state, your UI updates
                    instantly. No spinners and API calls.
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
                    users.
                </>
            ),
        },
    ];
    return (
        <GappedGrid>
            <div className="col-span-3">
                <SectionHeader
                    title="Why local-first?"
                    slogan={
                        <>
                            <p>
                                With local-first, your data is stored locally,
                                then synced to the server. This comes with the
                                following benefits.
                            </p>
                        </>
                    }
                />

                <div className="mt-8 flex flex-col gap-6">
                    {features.map(({ title, icon: Icon, description }) => (
                        <div key={title} className="flex items-center gap-4">
                            <Icon
                                size={36}
                                className="shrink-0  size-12 text-blue p-2 rounded-lg bg-blue-50 dark:text-blue-500 dark:bg-stone-900"
                                strokeWidth={1.5}
                            />
                            <Prose>
                                <p>
                                    <strong>{title}</strong>. {description}
                                </p>
                            </Prose>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-full bg-stone-200 col-span-3" />
        </GappedGrid>
    );
}
