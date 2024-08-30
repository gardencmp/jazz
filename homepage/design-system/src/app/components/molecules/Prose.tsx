import clsx from "clsx";
import { ReactNode } from "react";

export function Prose(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={clsx(
                "mb-4",
                "max-w-none prose-stone dark:prose-invert",
                "prose-headings:font-display",
                "prose-h1:text-4xl lg:prose-h1:text-5xl prose-h1:font-medium prose-h1:tracking-tight",
                "prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:font-medium prose-h2:tracking-tight",
                "prose-p:max-w-3xl prose-p:leading-snug",
                "prose-strong:font-medium",
                "prose-code:font-normal prose-code:leading-tight prose-code:before:content-none prose-code:after:content-none prose-code:bg-stone-100 prose-code:dark:bg-stone-900 prose-code:p-1 prose-code:rounded",
                "prose-pre:text-black dark:prose-pre:text-white prose-pre:max-w-3xl prose-pre:text-[0.8em] prose-pre:leading-[1.3] prose-pre:-mt-2 prose-pre:my-4 prose-pre:px-10 prose-pre:py-2 prose-pre:-mx-10 prose-pre:bg-transparent",
                "[&_pre_.line]:relative [&_pre_.line]:min-h-[1.3em] [&_pre_.lineNo]:text-[0.75em] [&_pre_.lineNo]:text-stone-300 [&_pre_.lineNo]:dark:text-stone-700 [&_pre_.lineNo]:absolute [&_pre_.lineNo]:text-right [&_pre_.lineNo]:w-8 [&_pre_.lineNo]:-left-10 [&_pre_.lineNo]:top-[0.3em] [&_pre_.lineNo]:select-none",
                props.className || "prose lg:prose-lg"
            )}
        >
            {props.children}
        </div>
    );
}

export function SmallProse(props: { children: ReactNode; className?: string }) {
    return <Prose className="prose prose-sm">{props.children}</Prose>;
}