"use client";

import { createJazzReactApp, useDemoAuth, DemoAuthBasicUI } from "jazz-react";
import { JazzAccount } from "@/schema";

const Jazz = createJazzReactApp({
  AccountSchema: JazzAccount,
});

export const { useAccount, useCoState } = Jazz;

export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        // replace `you@example.com` with your email as a temporary API key
        peer="wss://mesh.jazz.tools/?key=you@example.com"
      >
        {children}
      </Jazz.Provider>
      {authState.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Book Shelf" state={authState} />
      )}
    </>
  );
}
