"use client";

import { IframeHTMLAttributes, useLayoutEffect, useRef, useState } from "react";

const dimensions = {
  width: 200,
  height: 800,
};

function Iframe(props: IframeHTMLAttributes<HTMLIFrameElement>) {
  const { src } = props;
  return (
    <iframe
      {...props}
      src={src}
      className="dark:bg-black w-full"
      {...dimensions}
      allowFullScreen
    />
  );
}

export function ResponsiveIframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & { localsrc: string },
) {
  const [url, setUrl] = useState<string | undefined>();
  const [src, setSrc] = useState<string | undefined>();

  const user1 = "A";
  const user2 = "B";

  const isLocal = window.location.hostname === "localhost";
  // const isLocal = false;

  const [src1, setSrc1] = useState(
    (isLocal ? "http://localhost:5173" : "https://chat.jazz.tools") +
      `?user=${user1}`,
  );
  const [src2, setSrc2] = useState(
    (isLocal ? "http://localhost:5174" : "https://jazz-chat-2.vercel.app") +
      `?user=${user2}`,
  );

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

  return (
    <div className="grid grid-cols-2 justify-center gap-8">
      <Iframe src={src1} />
      <Iframe src={src2} />
    </div>
  );
}
