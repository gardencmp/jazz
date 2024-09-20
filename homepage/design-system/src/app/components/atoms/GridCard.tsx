import clsx from "clsx";
import { ReactNode } from "react";

export function GridCard(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={clsx(
                "col-span-2 p-4 [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0",
                "border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm",
                props.className
            )}
        >
            {props.children}
        </div>
    );
}