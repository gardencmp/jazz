import CodeStepOne from "./CodeStepOne.mdx";
import CodeStepTwo from "./CodeStepTwo.mdx";
import CodeStepThree from "./CodeStepThree.mdx";
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
                "rounded-t-md flex-1 bg-white border-t border-x border-stone-200 dark:bg-stone-925 dark:border-stone-900",
            )}
        >
            <div className="flex px-3 border-b border-stone-200 dark:border-stone-900">
                <span className="text-xs border-b border-blue py-1.5">
                    {fileName}
                </span>
            </div>
            <pre className="text-xs">{children}</pre>
        </div>
    );
}

function Step({
    step,
    description,
    children,
}: {
    step: number;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={clsx(
                "rounded-lg flex flex-col gap-4 pt-4 px-4 bg-white shadow-2xl shadow-stone-800/10 border border-stone-200",
                "dark:bg-stone-925 dark:border-stone-900",
                "col-span-2",
            )}
        >
            <p className="font-handwritten text-stone-900 dark:text-white">
                Step {step}
            </p>
            <h3>{description}</h3>
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
                    description="Create a Collaborative Value, and it will be synced and persisted automatically."
                >
                    <Code fileName="sendMessage.ts">
                        <CodeStepTwo />
                    </Code>
                </Step>
                <Step
                    step={3}
                    description="Read your data like simple local state. The UI updates instantly across all devices and users. 🎉"
                >
                    <Code fileName="ChatScreen.tsx">
                        <CodeStepThree />
                    </Code>
                </Step>
            </GappedGrid>
        </div>
    );
}
