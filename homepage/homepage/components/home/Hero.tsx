import { LucideIcon } from "lucide-react";
import Image from "next/image";

export function Hero({
    features,
}: {
    features: { title: string; icon: LucideIcon }[];
}) {
    const imageProps = {
        alt: "Code samples for defining a schema for Jazz, pushing data, and subscribing to changes.",
        width: 1100,
        height: 852,
    };

    return (
        <div className="container grid gap-5 lg:gap-0 md:grid-cols-2">
            <div className="flex flex-col gap-4 pt-10 md:pt-16 md:pb-16 lg:pb-0 lg:pt-28">
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter">
                    Build your next app
                    <br /> with sync
                </h1>

                <p className="text-pretty md:leading-relaxed text-stone-700 max-w-2xl dark:text-stone-200 md:text-xl">
                    Jazz is an open-source framework for building local-first
                    apps, removing 90% of the backend and infrastructure
                    complexity.
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                    {features.map(({ title, icon: Icon }) => (
                        <div
                            key={title}
                            className="flex text-xs sm:text-sm gap-2 items-center"
                        >
                            <span className="text-blue p-1.5 rounded-lg bg-blue-50 dark:text-stone-200 dark:bg-stone-900">
                                <Icon size={16} />
                            </span>
                            <p>{title}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-2xl mx-auto flex items-center sm:pt-16 lg:pl-8 lg:pt-18 md:ml-0 md:-mr-4">
                <Image
                    className="dark:hidden"
                    src="/code-samples.png"
                    {...imageProps}
                />
                <Image
                    className="hidden dark:block"
                    src="/code-samples-dark.png"
                    {...imageProps}
                />
            </div>
        </div>
    );
}
