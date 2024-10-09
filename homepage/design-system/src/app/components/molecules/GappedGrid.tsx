import clsx from "clsx";
import { ReactNode } from "react";
import { H2 } from "../../components/atoms/Headings";

export function GappedGrid({
    children,
    className,
    title,
    description
}: {
    children: ReactNode;
    className?: string;
    title?: string;
    description?: string;
}) {
    return (
        <div
            className={clsx(
                "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4",
                "items-stretch",
                className
            )}
        >
            {description && <p className="uppercase tracking-wide font-medium text-sm">{description}</p>}
            {title && <H2 className="col-span-full">{title}</H2>}
            {children}
        </div>
    );
}
