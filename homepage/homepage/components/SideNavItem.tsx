import { ReactNode } from "react";
import { clsx } from "clsx";
import Link from "next/link";

export function SideNavItem({
    href,
    children,
    className = "",
}: {
    href?: string;
    children: ReactNode;
    className?: string;
}) {
    const classes = clsx(className, "py-1 block hover:transition-colors");

    if (href) {
        return (
            <Link
                href={href}
                className={clsx(
                    classes,
                    "hover:text-black dark:hover:text-stone-200 transition-colors hover:transition-none",
                )}
            >
                {children}
            </Link>
        );
    }

    return <p className={classes}>{children}</p>;
}
