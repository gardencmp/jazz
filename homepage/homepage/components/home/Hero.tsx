import { LucideIcon } from "lucide-react";

export function Hero({
    features,
}: {
    features: { title: string; icon: LucideIcon }[];
}) {
    return (
        <div className="container grid gap-x-8 gap-y-10 py-12 lg:py-24 lg:gap-0 lg:grid-cols-3">
            <div className="flex flex-col justify-center gap-4 lg:col-span-3 lg:gap-8">
                <p className="uppercase text-blue tracking-wide text-sm font-medium dark:text-stone-400">
                    Local-first development toolkit
                </p>
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter">
                    Ship top-tier apps, with less code.
                </h1>

                <div
                  className="space-y-2 text-pretty md:leading-relaxed text-stone-700 max-w-2xl dark:text-stone-200 md:text-xl">
                    <p>
                        Jazz is a framework for building local-first apps &mdash; an architecture embraced
                        by industry leaders today like Linear and Figma.
                    </p>
                    <p>
                        {" "}
                        Fully open source. Host with Jazz Cloud or self-host.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2 max-w-3xl sm:grid-cols-4 sm:gap-4">
                    {features.map(({title, icon: Icon}) => (
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
        </div>
    );
}
