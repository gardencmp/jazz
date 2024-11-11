"use client";

import { CopyIcon } from "lucide-react";
import { IframeHTMLAttributes, useLayoutEffect, useRef, useState } from "react";

export function ResponsiveIframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & { localsrc: string },
) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [url, setUrl] = useState<string | undefined>();
  const [src, setSrc] = useState<string | undefined>();

  const dimensions = {
    width: 300,
    height: 400,
  };

  useLayoutEffect(() => {
    const listener = (e: MessageEvent) => {
      console.log("navigate", e.data.url);
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
    setSrc(
      window.location.hostname === "localhost" ? props.localsrc : props.src,
    );
    setUrl(
      window.location.hostname === "localhost" ? props.localsrc : props.src,
    );
  }, [props.src, props.localsrc]);

  const copyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <>
      <div className="bg-white flex gap-3 border-b text-xs dark:bg-stone-925">
        <input
          className="flex-1 font-mono bg-transparent overflow-hidden text-ellipsis py-2 px-3"
          value={url?.replace("http://", "").replace("https://", "")}
          onClick={(e) => e.currentTarget.select()}
          onBlur={(e) => e.currentTarget.setSelectionRange(0, 0)}
          readOnly
        />
        {url?.includes("/#/chat/") && (
          <button
            type="button"
            className="text-blue-600 flex items-center gap-1.5 py-2 px-3"
            onClick={copyUrl}
          >
            <CopyIcon className="hidden sm:inline" size={12} />
            <span>
              Copy URL{" "}
              <span className="hidden sm:inline">to invite others</span>
            </span>
          </button>
        )}
      </div>
      <div className="flex-1 bg-stone-100 flex items-stretch justify-center p-2 sm:p-6 dark:bg-stone-925">
        <div className="border rounded-lg overflow-hidden shadow-2xl w-[20rem] min-h-[30rem]">
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
        <div className="border rounded-lg overflow-hidden shadow-2xl w-[20rem] min-h-[30rem]">
          <div className="h-full">
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
