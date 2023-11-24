export function Slogan(props: { children: ReactNode; small?: boolean }) {
    return (
        <div
            className={[
                "leading-snug mb-5 max-w-3xl text-stone-700 dark:text-stone-200",
                props.small ? "text-lg lg:text-xl -mt-2" : "text-xl lg:text-2xl -mt-5",
            ].join(" ")}
        >
            {props.children}
        </div>
    );
}

export function Grid({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                "mt-10 items-stretch",
                className
            )}
        >
            {children}
        </div>
    );
}

export function GridItem(props: { children: ReactNode; className?: string }) {
    return <div className={props.className || ""}>{props.children}</div>;
}

export function GridFeature(props: {
    icon: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={[
                "p-4 flex items-center gap-2",
                "not-prose text-base",
                "border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm",
                props.className || "",
            ].join(" ")}
        >
            <div className="text-stone-500 mr-2">{props.icon}</div>
            {props.children}
        </div>
    );
}

export function GridCard(props: { children: ReactNode; className?: string }) {
    return (
        <div
            className={[
                "p-4 [&>h4]:mt-0 [&>h3]:mt-0 [&>:last-child]:mb-0",
                "border border-stone-200 dark:border-stone-800 rounded-xl  shadow-sm",
                props.className,
            ].join(" ")}
        >
            {props.children}
        </div>
    );
}

export function MultiplayerIcon() {
    return (
        <div className="w-8 h-8 -my-1 -mr-2 relative z-0">
            <MousePointer2Icon
                size="20"
                absoluteStrokeWidth
                strokeWidth={2}
                className="absolute top-1 right-0"
            />
            <MousePointer2Icon
                size="16"
                absoluteStrokeWidth
                strokeWidth={2}
                className="absolute bottom-1 left-0 -scale-x-100"
            />
        </div>
    );
}

export function ComingSoonBadge({when = "soon"}: {when?: string}) {
    return (
        <span className="bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400 border border-stone-300 dark:border-stone-700 text-[0.6rem] px-1 py-0.5 rounded-xl align-text-top">
            Coming&nbsp;{when}
        </span>
    );
}

import { IframeHTMLAttributes, ReactNode } from "react";
import { ResponsiveIframe as ResponsiveIframeClient } from "./ResponsiveIframe";
import { HandIcon, MousePointer2Icon, TextCursorIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResponsiveIframe(
    props: IframeHTMLAttributes<HTMLIFrameElement>
) {
    return <ResponsiveIframeClient {...props} />;
}
