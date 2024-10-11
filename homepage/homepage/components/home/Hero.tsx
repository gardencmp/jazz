import { LucideIcon } from "lucide-react";
import { CodeGroup } from "@/components/CodeGroup";
import { clsx } from "clsx";
import Image from "next/image";

export function Hero({
    features,
}: {
    features: { title: string; icon: LucideIcon }[];
}) {
    return (
        <div className="container grid grid-cols-2">
            <div className="pt-24">
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl mb-8 font-medium tracking-tighter">
                    Build your next app
                    <br /> with sync
                </h1>

                <p className="text-lg text-pretty md:leading-relaxed text-stone-700 max-w-2xl dark:text-stone-200 md:text-xl mb-8">
                    Jazz is an open-source framework for building local-first
                    apps, removing 90% of the backend and infrastructure
                    complexity.
                </p>

                <div className="grid grid-cols-4 gap-4">
                    {features.map(({ title, icon: Icon }) => (
                        <div
                            key={title}
                            className="flex text-sm gap-2 items-center"
                        >
                            <span className="text-blue p-1.5 rounded-lg bg-blue-50">
                                <Icon size={16} />
                            </span>
                            <p>{title}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pl-8 pt-16 -mr-4 flex items-center">
                <Image
                    src="/code-samples.png"
                    alt="Code samples"
                    width={1100}
                    height={852}
                />
            </div>
        </div>
    );
}
