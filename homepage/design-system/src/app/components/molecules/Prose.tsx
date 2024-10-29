import clsx from "clsx";
import { ReactNode } from "react";

export function Prose(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={clsx(
                props.className,
                "prose dark:prose-invert",
                "prose-strong:dark:text-white",
                "prose-code:dark:bg-stone-900",
            )}
        >
            {props.children}
        </div>
    );
}

export function SmallProse(props: { children: ReactNode; className?: string }) {
    return <Prose className="prose prose-sm">{props.children}</Prose>;
}
