import { LucideIcon, StarIcon } from "lucide-react";
import CodeStepOne from "./CodeStepOne.mdx";
import CodeStepTwo from "./CodeStepTwo.mdx";
import CodeStepThree from "./CodeStepThree.mdx";
import { clsx } from "clsx";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";

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
                "rounded-t-md flex-1 bg-white border-t border-x border-stone-200 dark:bg-stone-925 dark:border-stone-900",
            )}
        >
            <div className="flex justify-between items-baseline px-3 border-b border-stone-200 dark:border-stone-900">
                <span className="text-xs border-b border-blue py-1.5">
                    {fileName}
                </span>
            </div>
            <pre className="text-xs">{children}</pre>
        </div>
    );
}

export function HowItWorks() {
    const imageProps = {
        alt: "Code samples for defining a schema for Jazz, pushing data, and subscribing to changes.",
        width: 1100,
        height: 852,
    };

    return (
        <div className="grid gap-8">
            <div className="grid gap-3">
                <p className="uppercase text-blue tracking-wide text-sm font-medium dark:text-stone-400">
                    Collaborative Values
                </p>

                <H2>Build entire apps using only client-side code</H2>
            </div>
            <div className="grid grid-cols-3 gap-8 lg:gap-4">
                <div className="rounded-lg flex flex-col gap-4 pt-4 px-4 bg-white shadow-2xl shadow-stone-800/10 border border-stone-200 dark:bg-stone-925 dark:border-stone-900">
                    <p className="font-handwritten text-stone-900 dark:text-white">
                        Step 1
                    </p>
                    <h3 className="text-stone-900 dark:text-white">
                        Define your schema using Collaborative Values &mdash;
                        your new building blocks.
                    </h3>
                    <Code title="Step 1" fileName="schema.ts">
                        <CodeStepOne />
                    </Code>
                </div>
                <div className="rounded-lg flex flex-col gap-4 pt-4 px-4 bg-white shadow-2xl shadow-stone-800/10 border border-stone-200 dark:bg-stone-925 dark:border-stone-900">
                    <p className="font-handwritten text-stone-900 dark:text-white">
                        Step 2
                    </p>
                    <h3 className="text-stone-900 dark:text-white">
                        Create a Collaborative Value, and it will be synced and
                        persisted automatically.
                    </h3>
                    <Code title="Step 1" fileName="sendMessage.ts">
                        <CodeStepTwo />
                    </Code>
                </div>
                <div className="rounded-lg flex flex-col gap-4 pt-4 px-4 bg-white shadow-2xl shadow-stone-800/10 border border-stone-200 dark:bg-stone-925 dark:border-stone-900">
                    <p className="font-handwritten text-stone-900 dark:text-white">
                        Step 3
                    </p>
                    <h3 className="text-stone-900 dark:text-white">
                        Read your data like simple local state. The UI updates
                        instantly across all devices and users. 🎉
                    </h3>
                    <Code title="Step 1" fileName="ChatScreen.tsx">
                        <CodeStepThree />
                    </Code>
                </div>
            </div>
        </div>
    );
}
