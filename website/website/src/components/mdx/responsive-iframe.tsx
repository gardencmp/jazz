"use client";

import { useLayoutEffect, useState, useRef, IframeHTMLAttributes } from "react";

export const ResponsiveIframe = (
  props: IframeHTMLAttributes<HTMLIFrameElement> & { localSrc: string },
) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [url, setUrl] = useState<string | undefined>();
  const [src, setSrc] = useState<string | undefined>();

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
      window.location.hostname === "localhost" ? props.localSrc : props.src,
    );
    setUrl(
      window.location.hostname === "localhost" ? props.localSrc : props.src,
    );
  }, [props.src, props.localSrc]);

  return (
    <div
      className={
        "w-full h-full flex flex-col items-stretch border border-stone-100 dark:border-stone-900 " +
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
          src={src}
          className="dark:bg-black"
          {...dimensions}
          allowFullScreen
        />
      </div>
    </div>
  );
};
