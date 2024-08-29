import clsx from "clsx";
import { ReactNode } from "react";

export function GappedGrid({
    children,
    className,
    title
}: {
    children: ReactNode;
    className?: string;
    title?: string;
}) {
    return (
        <div
            className={clsx(
                "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
                "mb-10 items-stretch",
                className
            )}
        >
            {title && <h2 className={clsx(
                    "col-span-full",
                    "font-display",
                    "text-2xl",
                    "font-semibold",
                    "tracking-tight"
                )}>{title}</h2>}
            {children}
        </div>
    );
}