"use client";

import {
    useLayoutEffect,
    useState,
    useRef,
    IframeHTMLAttributes,
    useEffect,
} from "react";

export function ResponsiveIframe(
    props: IframeHTMLAttributes<HTMLIFrameElement> & { localSrc: string },
) {
    const containerRef = useRef<HTMLDivElement>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [url, setUrl] = useState<string | undefined>();
    const [src, setSrc] = useState<string | undefined>();
    const [inviteUrl, setInviteUrl] = useState<string | undefined>(url);

    useEffect(() => {
        if (url?.includes("/chat/")) {
            setInviteUrl(url?.replace("http://", "").replace("https://", ""));
        } else {
            setInviteUrl(undefined);
        }
    }, [url]);

    useLayoutEffect(() => {
        const listener = (e: MessageEvent) => {
            console.log(e);
            if (e.data.type === "navigate" && src?.startsWith(e.origin)) {
                setUrl(e.data.url);
            }
        };
        window.addEventListener("message", listener);
        return () => {
            window.removeEventListener("message", listener);
        };
    }, [src]);

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

    useLayoutEffect(() => {
        setSrc(
            window.location.hostname === "localhost"
                ? props.localSrc
                : props.src,
        );
        setUrl(
            window.location.hostname === "localhost"
                ? props.localSrc
                : props.src,
        );
    }, [props.src, props.localSrc]);

    return (
        <>
            {inviteUrl && (
                <div className="border-b dark:border-stone-800 dark:bg-stone-900 py-2 px-3">
                    <div className="flex gap-3 text-xs items-center">
                        <p>
                            Invite friends to join the chat:{" "}
                            <a
                                href={inviteUrl}
                                className="flex-1 underline text-blue-500"
                            >
                                {inviteUrl}
                            </a>
                        </p>
                    </div>
                </div>
            )}
            <div className="p-12 flex-1 bg-stone-100 flex items-stretch justify-center">
                <div className="border rounded-lg overflow-hidden shadow-2xl w-[20rem]">
                    <div className="h-full" ref={containerRef}>
                        <iframe
                            {...props}
                            src={src}
                            className="dark:bg-black w-full"
                            {...dimensions}
                            allowFullScreen
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
