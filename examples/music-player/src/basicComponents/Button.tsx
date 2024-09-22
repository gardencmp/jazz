import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Button(props: {
    className?: string;
    onClick?: () => void;
    children: ReactNode;
}) {
    return (
        <button
            onClick={props.onClick}
            className={cn(
                "p-2 bg-blue-300 hover:cursor-pointer flex items-center",
                props.className,
            )}
        >
            {props.children}
        </button>
    );
}
