import clsx from "clsx";
import { ReactNode } from "react";

export function SectionHeader({
    title,
    slogan,
}: {
    title: ReactNode;
    slogan: ReactNode;
}) {
    return (
        <header className="mb-5">
            <h2
                className={clsx(
                    "font-display",
                    "text-2xl",
                    "mb-2",
                    "font-semibold",
                    "tracking-tight"
                )}
            >
                {title}
            </h2>
            <h3
                className={clsx(
                    "text-lg lg:text-xl",
                    "leading-snug",
                    "tracking-tight",
                    "max-w-4xl",
                    "text-stone-700 dark:text-stone-500"
                )}
            >
                {slogan}
            </h3>
        </header>
    );
}
