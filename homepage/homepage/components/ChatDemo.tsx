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

    const listener = (e: MessageEvent) => {
      const isValidOrigin = e.origin === server1Url.origin;

      if (e.data.type === "chat-load" && isValidOrigin && e.data.id) {
        setChatId(e.data.id);
      }
    };
    window.addEventListener("message", listener);
    return () => {
      window.removeEventListener("message", listener);
    };
  }, [chatId, server1, server2]);

  const server2WithSameChatId = useMemo(() => {
    if (chatId && server2) {
      const server2Url = new URL(server2);
      server2Url.hash = chatId;
      return server2Url.toString();
    }

    return null;
  }, [chatId, server2]);

  if (!server1) return null;

  return (
    <div className="grid grid-cols-2 justify-center gap-8">
      <Iframe src={server1} />
      {server2WithSameChatId && <Iframe src={server2WithSameChatId} />}
    </div>
  );
}
