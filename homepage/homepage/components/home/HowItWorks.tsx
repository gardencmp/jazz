import CodeStepOne from "./CodeStepOne.mdx";
import CodeStepTwo from "./CodeStepTwo.mdx";
import CodeStepThree from "./CodeStepThree.mdx";
import CodeStepCloud from "./CodeStepCloud.mdx";
import { clsx } from "clsx";
import { H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";

function Code({
    children,
    className,
    fileName,
}: {
    children: React.ReactNode;
    className?: string;
    fileName?: string;
}) {
    return (
        <div
            className={clsx(
                className,
                "w-[480px] relative -right-2 max-w-full overflow-x-auto ml-auto rounded-tl-lg overflow-hidden",
                "shadow-xl shadow-blue/20 ",
                "border border-stone-200 dark:border-stone-900",
                "rounded-t-md flex-1 bg-white ring ring-4 ring-stone-400/20 dark:bg-stone-925",
            )}
        >
            <div className="flex px-4 border-b border-stone-200 dark:border-stone-900">
                <span className="text-sm border-b border-blue py-2">
                    {fileName}
                </span>
            </div>
            <pre className="text-sm p-1">{children}</pre>
        </div>
    );
}

function Step({
    step,
    description,
    children,
    className,
}: {
    step: number;
    description: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={clsx(
                className,
                "rounded-lg overflow-hidden shadow-sm flex flex-col gap-6 bg-white border border-stone-200",
                "pt-4 lg:pt-6",
                "dark:bg-stone-925 dark:border-stone-900",
                "col-span-2 lg:col-span-3",
            )}
        >
            <div className="flex gap-3 px-4 lg:px-6">
                <p className="font-semibold inline-flex items-center justify-center text-center bg-blue-50 size-8 rounded-full text-blue font-mono">
                    {step}
                </p>
                <p className="max-w-md mt-1.5">{description}</p>
            </div>
            {children}
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
            <GappedGrid>
                <Step
                    step={1}
                    description="Define your schema using Collaborative Values &mdash; your new building blocks."
                >
                    <Code fileName="schema.ts">
                        <CodeStepOne />
                    </Code>
                </Step>
                <Step
                    step={2}
                    description="Connect to sync and storage infrastructure (Jazz Cloud or self-hosted) using your email address as an API key."
                >
                    <Code fileName="main.tsx">
                        <CodeStepCloud />
                    </Code>
                </Step>
                <Step
                    step={3}
                    description="Create a Collaborative Value, and it will be synced and persisted automatically."
                >
                    <Code fileName="sendMessage.ts">
                        <CodeStepTwo />
                    </Code>
                </Step>
                <Step
                    step={4}
                    description="Read your data like simple local state. Get instant sync and UI updates across all devices and users. 🎉"
                >
                    <Code fileName="ChatScreen.tsx">
                        <CodeStepThree />
                    </Code>
                </Step>
            </GappedGrid>
        </div>
    );
}
