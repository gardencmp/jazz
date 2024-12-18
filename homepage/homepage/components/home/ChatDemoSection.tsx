"use client";

import { Card } from "gcmp-design-system/src/app/components/atoms/Card";
import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Icon } from "gcmp-design-system/src/app/components/atoms/Icon";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import Link from "next/link";
import QRCode from "qrcode";
import {
  IframeHTMLAttributes,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

function Iframe(
  props: IframeHTMLAttributes<HTMLIFrameElement> & {
    user: string;
  },
) {
  const { src, user } = props;

  return (
    <Card className="relative col-span-2 w-full overflow-hidden lg:col-span-2 dark:bg-black">
      <iframe
        {...props}
        src={src}
        className="w-full"
        width="200"
        height="390"
        allowFullScreen
      />
    </Card>
  );
}

export function ChatDemoSection() {
  const [chatId, setChatId] = useState<string | undefined>();

  const user1 = "Alice";
  const user2 = "Bob";

  const [server1, setServer1] = useState<string | null>();
  const [server2, setServer2] = useState<string | null>();
  const [shareUrl, setShareUrl] = useState<string | null>();
  const [qrCode, setQrCode] = useState<string | null>();

  let [copyCount, setCopyCount] = useState(0);
  let copied = copyCount > 0;

  useEffect(() => {
    if (copyCount > 0) {
      let timeout = setTimeout(() => setCopyCount(0), 1000);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copyCount]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const isLocal = window.location.hostname === "localhost";

    if (chatId) {
      const shareServer = isLocal
        ? "http://localhost:5173"
        : "https://chat.jazz.tools";
      const url = `${shareServer}/${chatId}`;
      setShareUrl(url);

      QRCode.toDataURL(url, {
        errorCorrectionLevel: "L",
      }).then((dataUrl) => {
        setQrCode(dataUrl);
      });

      return; // Once the chatId is set, we don't need to listen for messages anymore
    }

    setServer1(
      (isLocal ? "http://localhost:5173" : "https://jazz-chat-1.vercel.app") +
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

      if (e.data.type === "navigate" && isValidOrigin) {
        setChatId(new URL(e.data.url).hash);
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

  const copyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopyCount((count) => count + 1);
      });
    }
  };

  return (
    <div>
      <SectionHeader
        kicker="Demo"
        title="See it for yourself"
        slogan={
          <>
            A chat app with image upload in ~300 lines of client-side code.{" "}
            <Link href="https://github.com/garden-co/jazz/tree/main/examples/chat">
              View code
            </Link>
          </>
        }
      />
      <GappedGrid className="gap-y-8">
        <Iframe src={server1} user={user1} />
        {server2WithSameChatId && (
          <Iframe src={server2WithSameChatId} user={user2} />
        )}
        <div className="col-span-2 md:col-span-full lg:col-span-2">
          {chatId && shareUrl && (
            <div className="flex h-full flex-col justify-between gap-3 text-center md:gap-5">
              <H3 className="font-medium text-stone-900 dark:text-white !mb-0">
                Join the chat
              </H3>
              <p>Scan the QR code</p>

              {qrCode && (
                <img
                  src={qrCode}
                  className="size-48 border mx-auto rounded-lg"
                />
              )}
              <div className="flex items-center gap-2">
                <div className="h-px w-full border-t" />
                <p className="whitespace-nowrap">or copy the URL</p>
                <div className="h-px w-full border-t" />
              </div>
              <div>
                <div className="border rounded shadow-sm p-2 overflow-hidden leading-none flex-1 flex gap-2">
                  <input
                    className="flex-1"
                    type="text"
                    value={shareUrl}
                    onClick={(e) => e.currentTarget.select()}
                    onBlur={(e) => e.currentTarget.setSelectionRange(0, 0)}
                    readOnly
                  />
                  <button
                    type="button"
                    className="text-blue dark:text-blue-400"
                    onClick={copyUrl}
                  >
                    {copied ? (
                      <Icon name="check" size="xs" />
                    ) : (
                      <Icon name="copy" size="xs" />
                    )}
                    <span className="sr-only">Copy URL</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </GappedGrid>
    </div>
  );
}
