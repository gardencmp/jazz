import { createJazzReactApp, useDemoAuth } from "jazz-react";
import { useEffect, useRef } from "react";
import { getValueId } from "./lib/searchParams";

const key = getValueId()
  ? `downloader-e2e@jazz.tools`
  : `uploader-e2e@jazz.tools`;

const localSync = new URLSearchParams(location.search).has("localSync");

const Jazz = createJazzReactApp();

export const { useAccount, useCoState } = Jazz;

export function AuthAndJazz({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  const signedUp = useRef(false);

  useEffect(() => {
    if (state.state === "ready" && !signedUp.current) {
      state.signUp("Mister X");
      signedUp.current = true;
    }
  }, [state.state]);

  return (
    <Jazz.Provider
      auth={auth}
      peer={
        localSync
          ? `ws://localhost:4200?key=${key}`
          : `wss://cloud.jazz.tools/?key=${key}`
      }
    >
      {children}
    </Jazz.Provider>
  );
}
