"use client";

import { useLayoutEffect, useState, useRef, IframeHTMLAttributes } from "react";

export function ResponsiveIframe(
    props: IframeHTMLAttributes<HTMLIFrameElement>
) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [url, setUrl] = useState<string | undefined>(props.src);

    useLayoutEffect(() => {
        const listener = (e: MessageEvent) => {
            console.log(e);
            if (e.data.type === "navigate" && props.src?.startsWith(e.origin)) {
                setUrl(e.data.url);
            }
        };
        window.addEventListener("message", listener);
        return () => {
            window.removeEventListener("message", listener);
        };
    }, [props.src]);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => {
            if (!containerRef.current) return;
            setDimensions({
                width: containerRef.current.offsetWidth,
                height: containerRef.current.offsetHeight,
            });
        });
        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
        };
    }, [containerRef]);

    return (
        <div
            className={
                "w-full h-full flex flex-col items-stretch border border-stone-200 dark:border-stone-800 " +
                props.className
            }
        >
            <div className="rounded-t-xl bg-stone-100 dark:bg-stone-900 py-1.5 px-10 flex">
                <input
                    className="text-xs px-1 py-0.5 bg-stone-100 dark:bg-stone-900 outline outline-1 outline-stone-200 dark:outline-stone-800 w-full rounded text-center"
                    value={url?.replace("http://", "").replace("https://", "")}
                    onClick={(e) => e.currentTarget.select()}
                    onBlur={(e) => e.currentTarget.setSelectionRange(0, 0)}
                    readOnly
                />
            </div>
            <div className="flex-grow" ref={containerRef}>
                <iframe
                    {...props}
                    className="dark:bg-black"
                    {...dimensions}
                    allowFullScreen
                />
            </div>
        </div>
    );
}
