export function MultiplayerIcon({
    color,
    strokeWidth,
    size,
}: {
    color?: string;
    strokeWidth?: number;
    size: number;
}) {
    return (
        <div className="relative z-0" style={{ width: size, height: size }}>
            <MousePointer2Icon
                size={0.6 * size}
                strokeWidth={(strokeWidth || 1) / 0.6}
                color={color}
                className="absolute top-0 right-0"
            />
            <MousePointer2Icon
                size={0.5 * size}
                strokeWidth={(strokeWidth || 1) / 0.5}
                color={color}
                className="absolute bottom-0 left-0 -scale-x-100"
            />
        </div>
    );
}

export function ComingSoonBadge({ when = "soon" }: { when?: string }) {
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
    props: IframeHTMLAttributes<HTMLIFrameElement> & { localSrc: string },
) {
    return <ResponsiveIframeClient {...props} />;
}
