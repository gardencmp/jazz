import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  console.log({ state });

  const url = new URL(window.location.href);

  const user = url.searchParams.get("user") || undefined;

  return (
    <>
      {window.location.href}
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=chat-example-jazz@gcmp.io"
      >
        {children}
      </Jazz.Provider>
      {state.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Chat" state={state} user={user} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>,
);
