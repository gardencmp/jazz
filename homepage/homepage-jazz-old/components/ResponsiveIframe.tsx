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
    <div className={"w-full h-full flex flex-col " + props.className} >
      <input className="text-xs p-2" value={url} readOnly/>
      <div className="flex-grow" ref={containerRef}>
        <iframe {...props} className="" {...dimensions} allowFullScreen/>
      </div>
    </div>
  );
}
