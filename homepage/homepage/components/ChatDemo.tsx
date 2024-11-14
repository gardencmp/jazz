"use client";

import { clsx } from "clsx";
import {
  IframeHTMLAttributes,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const dimensions = {
  width: 200,
  height: 480,
};

function Iframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & {
    user: string;
    avatarClassName: string;
  },
) {
  const { src, user, avatarClassName } = props;

  const initials = user[0];

  return (
    <div className="relative col-span-2 w-full border rounded-xl shadow-sm overflow-hidden lg:col-span-2 dark:bg-black">
      <iframe
        {...props}
        src={src}
        className="w-full"
        {...dimensions}
        allowFullScreen
      />
      <div className="absolute top-0 left-0 w-full flex items-center gap-2 p-3 bg-white w-full border-b dark:bg-transparent">
        <div
          className={clsx(
            "size-8 lead rounded-full text-white font-medium inline-flex items-center justify-center",
            avatarClassName,
          )}
        >
          {initials}
        </div>
        {user}
      </div>
    </div>
  );
}

export function ChatDemo() {
  const [chatId, setChatId] = useState<string | undefined>();

  const user1 = "Alice";
  const user2 = "Bob";

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
    <>
      <Iframe src={server1} user={user1} avatarClassName="bg-pink-600" />
      {server2WithSameChatId && (
        <Iframe
          src={server2WithSameChatId}
          user={user2}
          avatarClassName="bg-green-600"
        />
      )}
    </>
  );
}
