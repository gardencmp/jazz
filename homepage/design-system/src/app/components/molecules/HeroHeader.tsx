import clsx from "clsx";
import { ReactNode } from "react";

export function HeroHeader({
    title,
    slogan,
}: {
    title: ReactNode;
    slogan: ReactNode;
}) {
    return (
        <header className="md:pt-20 mb-10">
            <h1
                className={clsx(
                    "font-display",
                    "text-5xl lg:text-6xl",
                    "mb-3",
                    "font-medium",
                    "tracking-tighter"
                )}
            >
                {title}
            </h1>
            <h2
                className={clsx(
                    "text-3xl lg:text-4xl",
                    "leading-snug",
                    "tracking-tight",
                    "mb-5",
                    "max-w-4xl",
                    "text-stone-700 dark:text-stone-500"
                )}
            >
                {slogan}
            </h2>
        </header>
    );
}
