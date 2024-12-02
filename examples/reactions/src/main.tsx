import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const Jazz = createJazzReactApp();

export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, authState] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=reactions-example@gcmp.io"
      >
        {children}
      </Jazz.Provider>
      <DemoAuthBasicUI appName="Reactions" state={authState} />
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
