import clsx from "clsx";
import { ReactNode } from "react";

export function Prose(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={clsx(
                "mb-4",
                "max-w-4xl prose-stone dark:prose-invert",
                "prose-headings:font-display",
                "lg:prose-h1:text-5xl prose-h1:font-medium prose-h1:tracking-tight",
                "lg:prose-h2:text-3xl prose-h2:font-medium prose-h2:tracking-tight",
                "prose-p:leading-snug",
                "prose-strong:font-medium",
                "prose-code:font-normal prose-code:leading-tight prose-code:before:content-none prose-code:after:content-none prose-code:bg-stone-100 prose-code:dark:bg-stone-900 prose-code:p-1 prose-code:rounded",
                "prose-pre:border prose-pre:bg-white prose-pre:dark:bg-stone-900 dark:prose-pre:border-stone-800",
                "prose-pre:text-black dark:prose-pre:text-white",
                // "[&_pre_.line]:relative [&_pre_.line]:min-h-[1.3em] [&_pre_.lineNo]:text-[0.75em] [&_pre_.lineNo]:text-stone-300 [&_pre_.lineNo]:dark:text-stone-700 [&_pre_.lineNo]:absolute [&_pre_.lineNo]:text-right [&_pre_.lineNo]:w-8 [&_pre_.lineNo]:-left-10 [&_pre_.lineNo]:top-[0.3em] [&_pre_.lineNo]:select-none",
                props.className || "prose"
            )}
        >
            {props.children}
        </div>
    );
}

export function SmallProse(props: { children: ReactNode; className?: string }) {
    return <Prose className="prose prose-sm">{props.children}</Prose>;
}
