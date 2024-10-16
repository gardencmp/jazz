import { LucideIcon } from "lucide-react";
import Image from "next/image";
import CodeStepOne from "./CodeStepOne.mdx";
import CodeStepTwo from "./CodeStepTwo.mdx";
import CodeStepThree from "./CodeStepThree.mdx";
import { clsx } from "clsx";

function ArrowUp({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            width="38"
            height="68"
            viewBox="0 0 38 68"
            fill="none"
        >
            <path
                d="M36.6256 60.8871C23.9101 48.0407 13.148 29.5751 8.82395 10.2155"
                stroke="currentColor"
                stroke-width="2"
                strokeLinecap="round"
            />
            <path
                d="M18.2246 15.796C12.8299 13.4567 8.67435 9.54967 7.65021 4.94946"
                stroke="currentColor"
                stroke-width="2"
                strokeLinecap="round"
            />
            <path
                d="M3.0291 20.2175C6.77469 15.1493 8.78101 9.40273 7.75686 4.80252"
                stroke="currentColor"
                stroke-width="2"
                strokeLinecap="round"
            />
        </svg>
    );
}

function Code({
    children,
    className,
    fileName,
    title,
}: {
    children: React.ReactNode;
    className?: string;
    fileName?: string;
    title?: string;
}) {
    return (
        <div
            className={clsx(
                className,
                "rounded bg-white border border-stone-200 dark:bg-stone-925 dark:border-stone-900",
            )}
        >
            <div className="flex justify-between items-baseline py-2 px-3 border-b border-stone-200 dark:border-stone-900">
                <span className="text-sm font-handwritten text-stone-900 dark:text-white">
                    {title}
                </span>
                <span className="text-xs ">{fileName}</span>
            </div>
            <pre className="text-xs">{children}</pre>
        </div>
    );
}

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
        <div className="container grid gap-x-5 gap-y-10 py-12 lg:gap-0 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4">
                <h1 className="font-display text-stone-950 dark:text-white text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter">
                    Build your next app
                    <br /> with sync
                </h1>

                <p className="text-pretty md:leading-relaxed text-stone-700 max-w-2xl dark:text-stone-200 md:text-xl">
                    Jazz is an open-source framework for building local-first
                    apps, removing 90% of the backend and infrastructure
                    complexity.
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4">
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

            <div className="max-w-2xl mx-auto md:ml-auto">
                <div className="grid sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-2 gap-4">
                    <Code title="Step 1" fileName="schema.ts">
                        <CodeStepOne />
                    </Code>
                    <Code title="Step 2" fileName="sendMessage.ts">
                        <CodeStepTwo />
                    </Code>
                    <div className="pb-16 sm:pb-0 sm:row-span-2 relative">
                        <Code
                            title="Step 3"
                            className="w-full sm:mt-8"
                            fileName="ChatScreen.tsx"
                        >
                            <CodeStepThree />
                        </Code>

                        <div className="absolute -bottom-4 sm:bottom-0 right-10 sm:right-8 font-handwritten text-stone-900 dark:text-white">
                            <ArrowUp className="ml-12" />
                            <p className="mt-3">
                                Instant sync & UI updates <br /> across devices
                                and users! 🎉
                            </p>
                        </div>
                    </div>
                </div>
                {/*<Image*/}
                {/*    className="dark:hidden"*/}
                {/*    src="/code-samples.png"*/}
                {/*    {...imageProps}*/}
                {/*/>*/}
                {/*<Image*/}
                {/*    className="hidden dark:block"*/}
                {/*    src="/code-samples-dark.png"*/}
                {/*    {...imageProps}*/}
                {/*/>*/}
            </div>
        </div>
    );
}
