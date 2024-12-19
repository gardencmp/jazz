import { createJazzReactApp, useDemoAuth } from "jazz-react";
import { useEffect, useRef } from "react";
import { PingPong } from "./pages/Inbox";

const url = new URL(window.location.href);

const key = `${getUserInfo()}@jazz.tools`;

let peer =
  (url.searchParams.get("peer") as `ws://${string}`) ??
  `wss://cloud.jazz.tools/?key=${key}`;

if (url.searchParams.has("local")) {
  peer = `ws://localhost:4200/?key=${key}`;
}

if (import.meta.env.VITE_WS_PEER) {
  peer = import.meta.env.VITE_WS_PEER;
}

const Jazz = createJazzReactApp({
  InboxMessageSchema: PingPong,
});

export const {
  useAccount,
  useCoState,
  useAcceptInvite,
  experimental: { useInboxListener, useInboxSender },
} = Jazz;

function getUserInfo() {
  return url.searchParams.get("userName") ?? "Mister X";
}

export function AuthAndJazz({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  const signedUp = useRef(false);

  useEffect(() => {
    if (state.state === "ready" && !signedUp.current) {
      const userName = getUserInfo();

      if (state.existingUsers.includes(userName)) {
        state.logInAs(userName);
      } else {
        state.signUp(userName);
      }

      signedUp.current = true;
    }
  }, [state.state]);

  return (
    <Jazz.Provider auth={auth} peer={`${peer}?key=${key}`}>
      {children}
    </Jazz.Provider>
  );
}
