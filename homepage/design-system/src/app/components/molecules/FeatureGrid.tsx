import clsx from "clsx";
import { ReactNode } from "react";
import { H2 } from "../atoms/Headings";
import { twMerge } from "tailwind-merge";

export function FeatureGrid({
    children,
    className,
    title,
}: {
    children: ReactNode;
    className?: string;
    title?: string;
}) {
    return (
        <div
            className={twMerge(
                clsx(
                    "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
                    "items-stretch",
                    className,
                ),
            )}
        >
            {title && <H2 className="col-span-full">{title}</H2>}
            {children}
        </div>
    );
}
