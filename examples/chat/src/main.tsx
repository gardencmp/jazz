import { ThemeProvider } from "@/themeProvider.tsx";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.tsx";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=chat-example-jazz@garden.co"
      >
        {children}
      </Jazz.Provider>
      {state.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Chat" state={state} />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <StrictMode>
      <JazzAndAuth>
        <App />
      </JazzAndAuth>
    </StrictMode>
  </ThemeProvider>,
);
