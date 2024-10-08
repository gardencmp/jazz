import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createJazzReactApp, DemoAuthBasicUI, useDemoAuth } from "jazz-react";
import { App } from "./app.tsx";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://mesh.jazz.tools/?key=chat-example-jazz@gcmp.io"
      >
        {children}
      </Jazz.Provider>
      {
        state.state !== "signedIn"
        && <DemoAuthBasicUI appName="Jazz Chat" state={state} />
      }
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>
);
