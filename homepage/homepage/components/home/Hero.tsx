import { LucideIcon } from "lucide-react";
import { CodeGroup } from "@/components/CodeGroup";

function CodeExample() {
    return (
        <div className="max-w-lg ml-auto relative ring-1 ring-stone-200 bg-white shadow-lg shadow-stone-900/5 h-full rounded-lg flex flex-col">
            <div className="absolute -top-px left-0 right-10 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/80 to-blue-300/0"></div>
            <div className="absolute -bottom-px left-10 right-0 h-px bg-gradient-to-r from-blue-300/0 via-blue-300/80 to-blue-300/0"></div>
            <div className="p-2 border-b">
                <div className="flex gap-1">
                    <span className="h-2.5 w-2.5 rounded-full border" />
                    <span className="h-2.5 w-2.5 rounded-full border" />
                    <span className="h-2.5 w-2.5 rounded-full border" />
                </div>
            </div>
            <div className="flex-1"></div>
        </div>
    );
}

export function Hero({
    features,
}: {
    features: { title: string; icon: LucideIcon }[];
}) {
    return (
        <div className="container lg:grid lg:grid-cols-2 lg:gap-x-0 lg:py-40">
            <div>
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl mb-8 font-medium tracking-tighter text-balance">
                    Build your next&nbsp;app with sync
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
            <div className="md:mx-auto md:max-w-2xl lg:mx-0 lg:pl-12">
                {/*<div*/}
                {/*  className="absolute inset-y-0 right-1/2 -z-10 -mr-10 w-[200%] skew-x-[-30deg] bg-white shadow-xl shadow-blue-600/10 ring-1 ring-blue-50 md:-mr-20 lg:-mr-36"*/}
                {/*  aria-hidden="true"*/}
                {/*/>*/}
                <div className="shadow-lg md:rounded-3xl">
                    <div className="bg-gradient-to-br from-blue-700 to-blue-500 [clip-path:inset(0)] md:[clip-path:inset(0_round_theme(borderRadius.3xl))]">
                        {/*<div*/}
                        {/*  className="absolute -inset-y-px left-1/2 -z-10 ml-10 w-[200%] skew-x-[-30deg] bg-blue-300 opacity-20 ring-1 ring-inset ring-white md:ml-20 lg:ml-36"*/}
                        {/*  aria-hidden="true"*/}
                        {/*/>*/}
                        <div className="relative px-6 pt-8 sm:pt-16 md:pl-16 md:pr-0">
                            <div className="mx-auto max-w-2xl md:mx-0 md:max-w-none">
                                <div className="w-screen overflow-hidden rounded-tl-xl bg-white">
                                    <div className="flex bg-white ring-1 ring-stone-800/5">
                                        <div className="-mb-px flex text-sm leading-6 text-stone-600">
                                            <div className="border-b border-r border-b-blue border-r-stone-800/10 bg-white/5 px-4 py-2 text-stone-800">
                                                chatScreen.tsx
                                            </div>
                                            <div className="border-r border-stone-600/10 px-4 py-2">
                                                schema.ts
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 pb-14 pt-6">
                                        <CodeGroup>code here</CodeGroup>
                                    </div>
                                </div>
                            </div>
                            {/*<div*/}
                            {/*  className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 md:rounded-3xl"*/}
                            {/*  aria-hidden="true"*/}
                            {/*/>*/}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function HeroOld({
    features,
}: {
    features: { title: string; icon: LucideIcon }[];
}) {
    return (
        <div className="container grid grid-cols-2 gap-3 py-24">
            <div>
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl mb-8 font-medium tracking-tighter text-balance">
                    Build your next&nbsp;app with sync
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

            <div>
                <CodeExample />
            </div>
        </div>
    );
}
