import clsx from "clsx";
import { ReactNode } from "react";

export function Prose(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={clsx(
                // "max-w-4xl prose-stone dark:prose-invert",
                // "prose-headings:font-display",
                // "lg:prose-h1:text-5xl prose-h1:font-medium prose-h1:tracking-tight",
                // "lg:prose-h2:text-3xl prose-h2:font-medium prose-h2:tracking-tight",
                // "prose-p:leading-snug",
                // "prose-strong:font-medium",
                // "prose-code:font-normal prose-code:before:content-none prose-code:after:content-none prose-code:bg-stone-100 prose-code:dark:bg-stone-900 prose-code:p-1 prose-code:rounded",
                // "prose-pre:border prose-pre:p-0 prose-pre:bg-stone-50 prose-pre:dark:bg-stone-900 dark:prose-pre:border-stone-800",
                // "prose-pre:text-black dark:prose-pre:text-white",
                props.className || "prose",
            )}
        >
            {props.children}
        </div>
    );
}

export function SmallProse(props: { children: ReactNode; className?: string }) {
    return <Prose className="prose prose-sm">{props.children}</Prose>;
}
