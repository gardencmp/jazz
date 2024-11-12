"use client";

import {
  IframeHTMLAttributes,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

export function ChatDemo() {
  const [chatId, setChatId] = useState<string | undefined>();

  const user1 = "A";
  const user2 = "B";

  const [server1, setServer1] = useState<string | null>();
  const [server2, setServer2] = useState<string | null>();

  useLayoutEffect(() => {
    if (chatId) return; // Once the chatId is set, we don't need to listen for messages anymore

    if (typeof window === "undefined") return;

    const isLocal = window.location.hostname === "localhost";

    setServer1(
      (isLocal ? "http://localhost:5173" : "https://chat.jazz.tools") +
        `?user=${user1}`,
    );
    setServer2(
      (isLocal ? "http://localhost:5174" : "https://jazz-chat-2.vercel.app") +
        `?user=${user2}`,
    );

    if (!server1 || !server2) return;

    const server1Url = new URL(server1);
    const server2Url = new URL(server2);

    const listener = (e: MessageEvent) => {
      const isValidOrigin =
        e.origin === server1Url.origin || e.origin === server2Url.origin;

      if (e.data.type === "chat-load" && isValidOrigin && e.data.id) {
        setChatId(e.data.id);
      }
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
    };
  }, [chatId, server1, server2]);

  const src1 = useMemo(() => {
    if (chatId && server1) {
      const server1Url = new URL(server1);
      server1Url.hash = chatId;
      return server1Url.toString();
    }

    return server1;
  }, [chatId, server1]);

  const src2 = useMemo(() => {
    if (chatId && server2) {
      const server2Url = new URL(server2);
      server2Url.hash = chatId;
      return server2Url.toString();
    }

    return server2;
  }, [chatId, server2]);

  if (!src1 || !src2) return null;

  return (
    <div className="grid grid-cols-2 justify-center gap-8">
      <Iframe src={src1} />
      <Iframe src={src2} />
    </div>
  );
}
