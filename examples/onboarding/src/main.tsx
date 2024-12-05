import App from "@/App.tsx";
import "@/index.css";
import { HRAccount } from "@/schema.ts";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import React from "react";
import ReactDOM from "react-dom/client";

const Jazz = createJazzReactApp({
  AccountSchema: HRAccount,
});
export const { useAccount, useCoState, useAcceptInvite } = Jazz;

const peer =
  (new URL(window.location.href).searchParams.get(
    "peer",
  ) as `ws://${string}`) ??
  "wss://cloud.jazz.tools/?key=onboarding-example-jazz@garden.co";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();
  return (
    <>
      <Jazz.Provider auth={auth} peer={peer}>
        {children}
      </Jazz.Provider>
      {authState.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Onboarding" state={authState} />
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </React.StrictMode>,
);
